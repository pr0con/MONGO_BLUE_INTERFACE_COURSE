const utils = require('./utilz.js');
const Mongo = require('./mongo.js');

const uWS = require('uWebSockets.js');


/* Another Mongo Wrapper just for fun */
const mongo = require('mongodb');
const ObjectId = require('mongodb').ObjectID;

const { v1: uuidv1 } = require('uuid');


function payload(type,data) {
	let payload = {
		type,
		data	
	}
	return payload
}

mongo.MongoClient.connect(utils.system_configuration['databases']['mongo']['url'], {useUnifiedTopology: true, useNewUrlParser: true}, async function(err,db) {
	if(!err) {
		
		let api = db.db('api');
		utils.logData('Mongo Wrapper Connected : OK');
		
		const app = uWS.SSLApp({
			//if certz are non-existant the connection will succeed as ws instead of wss !!!! 
			//by default it does this with out informing you so be carefull
			cert_file_name: utils.system_configuration['letsencrypt']['public_key_path'],
			key_file_name: utils.system_configuration['letsencrypt']['private_key_path']
		}).ws('/ws', {
			compression: uWS.SHARED_COMPRESSOR,
			maxPayloadLength: 16 * 1024 * 1024,
			idleTimeout: 0, //never timeout

			upgrade: (res,req,context) => {
				utils.logData('An Https connection wants to become WebSocket, URL: ', req.getUrl() + '!');
				//utils.logData('Ws connected via Address: ' + utils.ArrayBufferToString(res.getRemoteAddressAsText()));
				
				const upgradeAborted = {aborted: false};
				
				res.onAborted(() => {
					utils.logData('Foreign Abort Handler Executed...');
					upgradeAborted.aborted = true;
				});
				
				if(req.getHeader('origin') === "https://caos.pr0con.com") {
					res.upgrade({url: req.getUrl()},
						req.getHeader('sec-websocket-key'),
						req.getHeader('sec-websocket-protocol'),
						req.getHeader('sec-websocket-etensions'),
						context
					);
				}else {
					res.close(); //res.close() Should fire abort handler
					utils.logData('Killed Foreign Request'); 
				}	
			},
			open: async (ws) => {
				utils.logData('Ws connected via URL: ' + ws.url);
				//utils.logData('Ws connected via Address: ' + utils.ArrayBufferToString(ws.getRemoteAddress().toString()));
				utils.logData('Ws connected via Address: ' + utils.ArrayBufferToString(ws.getRemoteAddressAsText()));
				
				ws.id = "ws-"+uuidv1();
				
				let csrf_object = await utils.generateCSRFToken();
				let csrf_session_store_result = await Mongo.storeCSRFSession(ws.id, csrf_object);
				
				utils.logData('Sending Websocket Id & CSRFToken');
				ws.send(JSON.stringify(payload('client-websocket-id', ws.id)));
				ws.send(JSON.stringify(payload('client-websocket-csrf_token', csrf_object['csrf_token'])));
			},
			message: async (ws,message) => {
				let tjo = JSON.parse(utils.ArrayBufferToString(message));
				//console.log(tjo);
				
				let CSRFTokenSessionObject = await Mongo.findOne('sessions', {'wsid': ws.id, 'csrf_token': tjo['csrf']});
				//console.log('CSRFTokenSessionObject @MessageHandler: ', CSRFTokenSessionObject);
				
				if(CSRFTokenSessionObject !== null && 'csrf_token' in CSRFTokenSessionObject && (await utils.verifyCSRFToken(tjo['csrf'], CSRFTokenSessionObject['csrf_secret']))) {
					console.log('CSRF Valid!');
					
					let secure_message = false;
					if(tjo['jwt'] !== null && 'access_token' in tjo['jwt'] && 'lcid' in tjo['jwt']) {
						let lcid_record = await Mongo.findOne('LCIDs', {lcid: tjo['jwt']['lcid']});
						let decrypted_access_token = await utils.decryptData(tjo['jwt']['access_token'], lcid_record.iv.buffer, lcid_record.key.buffer);
						
						secure_message = await utils.verifyAccessToken(decrypted_access_token);
						//console.log(secure_message); //secure_message = access_token object
						if(!secure_message) {
							ws.send(JSON.stringify(payload('kill-credz',null)));
						}
						
						else if(secure_message) {
							switch(tjo['type']) {
								case "verify-access-token":
									console.log('verifying access token');
									ws.send(JSON.stringify(payload('access-token-verified', null)));
									
									/* 
										Generate Bypass token tied to wsid for other interfaces to authenticate to there respective backend servers
									*/
									let bypass_token = await utils.createBypassToken(ws.id);
									
									let d = new Date();
									let exp = d.setTime(d.getTime()+(30*60*1000)); //expires 30m
									
									let bt_insert_result = await Mongo.insertOne('bypass_tokens', {wsid: ws.id, exp });
									
									ws.send(JSON.stringify(payload('bypass-token', bypass_token)));
									
									break;
								case "get-databases":
									let databases = await Mongo.getDatabases();
									ws.send(JSON.stringify(payload('requested-databases', databases)));
									break;
								case "get-collections":
									let collections = await Mongo.getCollections(tjo['data']);
									ws.send(JSON.stringify(payload('requested-collections', collections)));
									break;
								case "get-documents":
									let documents = await Mongo.getDocuments(tjo['data']['db'], tjo['data']['col']);
									ws.send(JSON.stringify(payload('requested-documents', documents)));
									break;
								case "create-database": {
										let ndbr = await Mongo.createDatabase(tjo['data']);
									
										let databases = await Mongo.getDatabases();
										ws.send(JSON.stringify(payload('requested-databases', databases)));
									}
									break;
								case "create-collection":
									let ncolr = await Mongo.createCollection(tjo['data']['db'], tjo['data']['col']);
									let new_collections = await Mongo.getCollections(tjo['data']['db']);
									ws.send(JSON.stringify(payload('requested-collections', new_collections)));
									break;
								case "drop-database":
									let drop_db_result = await Mongo.dropDatabase(tjo['data']);
									
									let databases_after_drop = await Mongo.getDatabases();
									ws.send(JSON.stringify(payload('requested-databases', databases_after_drop)));
									break;
								case "drop-collection":
									let drop_col_result = await Mongo.dropCollection(tjo['data']['db'], tjo['data']['col']);
									
									let collection_after_drop = await Mongo.getCollections(tjo['data']['db']);
									ws.send(JSON.stringify(payload('requested-collections', collection_after_drop)));	
									break;
								case "insert-document": {
										let insert_result = await Mongo.insertNewDoc(tjo['data']['db'],tjo['data']['col'],tjo['data']['doc']);
									
										let documents = await Mongo.getDocuments(tjo['data']['db'], tjo['data']['col']);
										ws.send(JSON.stringify(payload('requested-documents', documents)));
										ws.send(JSON.stringify(payload('inserted-document', insert_result)));
									}
									break;
								case "update-document": {
										let update_result = await Mongo.updateDocument(tjo['data']['db'],tjo['data']['col'],tjo['data']['oid'],tjo['data']['values']);
										
										let documents = await Mongo.getDocuments(tjo['data']['db'], tjo['data']['col']);
										ws.send(JSON.stringify(payload('requested-documents', documents)));									
									
										utils.logData(`Modified ${update_result.modifiedCount} document.`);
									}
									break;
								case "insert-many": {
										let mod_data = JSON.parse(tjo['data']['data']);
										let insert_many_result = await Mongo.insertMany(tjo['data']['db'],tjo['data']['col'],mod_data);
										
										let documents = await Mongo.getDocuments(tjo['data']['db'], tjo['data']['col']);
										ws.send(JSON.stringify(payload('requested-documents', documents)));	
									}
									break;
								default:
									//unknown message?
									break;
							}
						}
					}
					
				} else {
					ws.send(JSON.stringify(payload('csrf-kill-signal',null)));
					ws.close();
				}
				
			},
			drain: (ws) => {
				utils.logData('Websocket Back Pressure: '+ws.getBufferedAmount());
			},
			close: async (ws,code,message) => {
				utils.logData('Websocket Closed');
				Mongo.deleteOne('sessions', {'wsid': ws.id});
				Mongo.deleteOne('bypass_tokens', {'wsid': ws.id});
			}
		}).listen(1300, async (sock) => {
			(sock) ? utils.logData('NodeJs WS Server Listening : 1300') : utils.logData('Something went horribly wrong! @server.js');
			
			/* purge old sessions at boot */
			let api_collections = await api.listCollections().toArray();
			let obj = api_collections.find(o => o.name === 'sessions');
			
			if(obj) api.collection("sessions").drop();
		});
		
	}else {
		utils.logData('Unable to wrap websocket with mongo...');
	}
});

/* Garbage Collection Ops */
setInterval(async function() {
	Mongo.gcLCIDs();
	Mongo.gcBypassTokens();
},5000);

process.on('unhandledRjection', (err, promise) => {
	console.log(`Caught Promise Rejection: ${err.message}`);
});
