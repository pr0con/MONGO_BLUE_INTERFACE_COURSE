import json
import pprint
import asyncio
import motor.motor_asyncio
from bson import json_util, ObjectId

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://mongod:SOMEHARDPASSWORD@localhost:27017')

pp = pprint.PrettyPrinter(sort_dicts = False) #maintains origonal order of fields

#just validate we have a bypass token for this wsid...
async def GetBypassTokenRecord(wsid):
	db = client['api']
	bypass_token_record = await db.bypass_tokens.find_one({'wsid': wsid});
	
	if bypass_token_record == None:
		return False
	elif bypass_token_record['wsid'] == wsid:
		return True
		
async def getDatabases():
	databases = await client.list_databases()
	return await databases.to_list(length=100)
	
async def getCollections(db):
	database = client[db]
	collections = await database.list_collection_names() #already a list	
	return collections
	
async def getDocuments(db,col):
	database = client[db]
	collection = database[col]
	

	n = await collection.count_documents({})
	docs = collection.find({})
	
	docs_to_list = await docs.to_list(length=100)
	docs_sanitized = json.loads(json_util.dumps(docs_to_list))
	
	#print(docs_sanitized)
	
	return docs_sanitized

		
async def dropDatabase(db):
	await client.drop_database(db)
	return True	

	
async def createDatabase(db):
	document = {'init': 1}
	create_db_result = await client[db]['init'].insert_one(document)
	print('result %s' % repr(create_db_result.inserted_id))
	return True
	
async def dropCollection(db,col):
	drop_col_result = client[db].drop_collection(col)
	return True		
	
async def createColleciton(db,col):
	document = {'init': 1}
	create_col_result = await client[db][col].insert_one(document)	
	print('result %s' % repr(create_col_result.inserted_id))
	return True	
	
async def insertDocument(db,col,doc):
	insert_result = await client[db][col].insert_one(doc)
	inserted_document = await client[db][col].find_one({'_id': insert_result.inserted_id })	
	
	doc_sanitized = json.loads(json_util.dumps(inserted_document))

	#ObjectId to string --> str(insert_result.inserted_id)
	return doc_sanitized
		
async def updateDocument(db,col,oid,values):		
	update_result = await client[db][col].update_one({'_id': ObjectId(oid)}, {'$set': values})
	return update_result
	
async def insertMany(db,col,data):
	jdocs = json.loads(data)
		
	insert_many_result = await client[db][col].insert_many(jdocs)
	return insert_many_result.inserted_ids
	
	
	
	