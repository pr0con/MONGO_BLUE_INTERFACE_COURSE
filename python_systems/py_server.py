import ssl
import asyncio
import json
import logging
import websockets

import py_modz
import py_mongo
py_modz.ck_unlock();

WEB_SOCKET_CLIENTS = set()

async def register(websocket):
	WEB_SOCKET_CLIENTS.add(websocket)
	
async def unregister(websocket):
	WEB_SOCKET_CLIENTS.remove(websocket)
	await websocket.close()

async def send_ws_packet(websocket, type, data):
	wsPkt = {}
	wsPkt['type'] = type
	wsPkt['data'] = data
	json_data = json.dumps(wsPkt)
	await websocket.send(json_data)
	
async def validateBypassToken(jwt,wsid, websocket):
	if await py_mongo.GetBypassTokenRecord(wsid):
		if await py_modz.verifyJWT(wsid, jwt):
			return True	
		else:
			await unregister(websocket)
			return False
	else:
		await unregister(websocket)
		return False


async def consumer(websocket,path):
	try:
		async for message in websocket:
			tjo = json.loads(message)
			if tjo["type"] == "set-ws-id":
				websocket.wsid = tjo["data"]
				await send_ws_packet(websocket, 'python-svr-msg', 'wsid registered')
				await send_ws_packet(websocket, 'ws-client-count', len(WEB_SOCKET_CLIENTS))
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					print("Websocket Registered and Validated: Success!!!")
			
			elif tjo["type"] == "get-databases":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					databases = await py_mongo.getDatabases()
					#print(databases)
					await send_ws_packet(websocket, 'requested-databases', databases)
			
			elif tjo["type"] == "get-collections":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					collections = await py_mongo.getCollections(tjo['data'])
					await send_ws_packet(websocket, 'requested-collections', collections)
					
			elif tjo["type"] == "get-documents":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					documents = await py_mongo.getDocuments(tjo['data']['db'],tjo['data']['col'])
					await send_ws_packet(websocket, 'requested-documents', documents)
			
				
			elif tjo["type"] == "drop-database":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					drop_result = await py_mongo.dropDatabase(tjo['data'])
					databases = await py_mongo.getDatabases()
					await send_ws_packet(websocket, 'requested-databases', databases)
			
			
			elif tjo["type"] == "create-database":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					create_db_result = await py_mongo.createDatabase(tjo["data"])
					databases = await py_mongo.getDatabases()
					await send_ws_packet(websocket, 'requested-databases', databases)
					
			elif tjo["type"] == "drop-collection":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					drop_col_result = await py_mongo.dropCollection(tjo['data']['db'],tjo['data']['col'])
					collections = await py_mongo.getCollections(tjo['data']['db'])
					await send_ws_packet(websocket, 'requested-collections', collections)
					
			elif tjo["type"] == "create-collection":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):			
					create_col_result = await py_mongo.createColleciton(tjo['data']['db'],tjo['data']['col'])
					collections = await py_mongo.getCollections(tjo['data']['db'])
					await send_ws_packet(websocket, 'requested-collections', collections)
			
			elif tjo["type"] == "insert-document":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					insert_doc_result = await py_mongo.insertDocument(tjo['data']['db'],tjo['data']['col'],tjo['data']['doc'])
					#print(insert_doc_result)
					
					documents = await py_mongo.getDocuments(tjo['data']['db'],tjo['data']['col'])
					await send_ws_packet(websocket, 'requested-documents', documents)					
					await send_ws_packet(websocket, 'inserted-document', insert_doc_result)
			
			elif tjo["type"] == "update-document":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					update_doc_result = await py_mongo.updateDocument(tjo['data']['db'],tjo['data']['col'],tjo['data']['oid'],tjo['data']['values'])
					
					documents = await py_mongo.getDocuments(tjo['data']['db'],tjo['data']['col'])
					await send_ws_packet(websocket, 'requested-documents', documents)
					
					print("Modified "+str(update_doc_result.modified_count)+" document(s)")
			
			elif tjo["type"] == "insert-many":
				if await validateBypassToken(tjo['jwt'], websocket.wsid, websocket):
					insert_many_result = await py_mongo.insertMany(tjo['data']['db'],tjo['data']['col'],tjo['data']['data'])
					
					documents = await py_mongo.getDocuments(tjo['data']['db'],tjo['data']['col'])
					await send_ws_packet(websocket, 'requested-documents', documents)
					
					print("Added new Docs: ")
					print(insert_many_result)					
					
			else:
				print("Operation not recognized.")
			
	except:
		print('Something went horribly wrong!!!')
	finally:
		if websocket in WEB_SOCKET_CLIENTS:
			await unregister(websocket)
		elif websocket.closed == True:
			#python has garbage collection and the websocket object shoul be removed at this point
			#but we can see if its still in memory using dump below from out utilz
			print('Websocket closed...')
			del websocket #we can force delete before garbage collection comment out to get dump
		else:
			py_modz.dump(websocket)	

async def handler(websocket, path):
	await register(websocket)
	consumer_task = asyncio.ensure_future(consumer(websocket,path)) #we could create multiple tasks to add to array below
	done, pending = await asyncio.wait([consumer_task], return_when=asyncio.FIRST_COMPLETED)
	for task in pending:
		task.cancel()

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('/etc/letsencrypt/live/caos.pr0con.com/cert.pem','/etc/letsencrypt/live/caos.pr0con.com/privkey.pem')

server = websockets.serve(handler, 'caos.pr0con.com', 1600, ssl=ssl_context)

asyncio.get_event_loop().run_until_complete(server)
asyncio.get_event_loop().run_forever()




