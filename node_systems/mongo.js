const utils = require('./utilz.js'); 

const mongo = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(utils.system_configuration['databases']['mongo']['url'], { useUnifiedTopology: true, useNewUrlParser: true }, ConfigureAPI);

let db = null;
let api = null;
let admin = null;

function ConfigureAPI(err, db_) {
	if(!err) {
		db = db_;
		api = db_.db('api');
		admin = db_.db('admin').admin();
		
		utils.logData('Mongo connected');	
	}
	if(err) {
		utils.logData('Mongo not connected');
	}
}

async function insertOne(col, doc) {
	let res = await api.collection(col).insertOne(doc).then((res) => {
		return doc;	 //this will attach the insert id to the doc above
	});
	
	return doc;
}

async function findOne(col,q) {
	let doc = await api.collection(col).findOne(q);
	return doc;
}

async function updateOne(col,q,data) {
	let ur = await api.collection(col).updateOne(q,data);	
	return ur['modifiedCount'];
}

async function deleteOne(col,q) {
	let del_result = await api.collection(col).deleteOne(q);
	utils.logData(`Deleted ${del_result.deletedCount} Record from ${col}`);
}

async function deleteMany(col, q) {
	let del_result = await api.collection(col).deleteMany(q);
	utils.logData(`Deleted ${del_result.deletedCount} Record(s) from ${col}`);
}

async function AuthenticateUser(creds) {
	let col = api.collection('users');
	
	let u = utils.decodeBase64(creds.username);
	let p = utils.decodeBase64(creds.password);
	
	let find = {
		$or: [
			{alias: u},
			{email: u}
		]
	}
	
	try {
		let user = await col.findOne(find);
		//console.log(user);
		 
		 if(user !== null) {
			let vp = await utils.bcryptValidatePassword(p, user.password);
			switch(vp) {
				case true:
					user['password'] = 'F00';
					let access_token = await utils.generateJwt(user, 'ACCESS_TOKEN');
					let refresh_token = await utils.generateJwt(user, 'REFRESH_TOKEN');
					//console.log(access_token);
					//console.log(refresh_token);
					
					let lcid = await utils.generateLifeCycleId();
					//console.log(lcid);
					
					api.collection('LCIDs').insertOne(lcid);
					
					//encrypt access_token and refresh_token
					let encrypted_access_token = await utils.encryptData(access_token, lcid.iv, lcid.key);
					let encrypted_refresh_token = await utils.encryptData(refresh_token, lcid.iv, lcid.key);
					
					return {lcid: lcid.lcid, access_token: encrypted_access_token, refresh_token: encrypted_refresh_token, user }
				case false:
				default:
					return false;
			}
			
		 }else {
			utils.logData('User not found. @mongo.js / AuthenticateUser()');
			return false	 
		 }
	}catch(error) {
		console.log(`Error: @mongo.js, something went horribly wrong!`, eval(error));
		return false
	}
}


async function storeCSRFSession(wsid, csrf_object) {
	let csrf_session_store_result = await insertOne('sessions', {wsid, ...csrf_object});
	return csrf_session_store_result;
}



/* Garbage Collection */
async function gcLCIDs() {
	let res = await api.collection('LCIDs').deleteMany({'exp': {$lt: new Date().getTime()}});
	if(res.deletedCount >= 1) { utils.logData(`Remove ${res.deletedCount} stale LCID(s).`); }
}

async function gcBypassTokens() {
	let res = await api.collection('bypass_tokens').deleteMany({'exp': {$lt: new Date().getTime()}});
	if(res.deletedCount >= 1) { utils.logData(`Remove ${res.deletedCount} stale Bypass Token(s).`); }	
}


/* Database Interface Functions */
async function getDatabases() {
	let dbs = await admin.listDatabases();
	return dbs;
}

async function getCollections(db_) {
	let database = db.db(db_);
	let collections = await database.listCollections().toArray();
	
	collections = collections.map(c => c.name);
	return collections;
}

async function getDocuments(db_,col) {
	let database = db.db(db_);
	let documents = await database.collection(col).find({}).toArray();
	
	return documents;	
}

async function createDatabase(newDb) {
	let newDB = db.db(newDb);
	let newCol = await newDB.collection('init').insertOne({init: true});
	
	return true;
}

async function createCollection(db_, col) {
	let cdb = db.db(db_);
	let ncr = await cdb.collection(col).insertOne({init: true});
	
	return true;
}

async function dropDatabase(db_) {
	let ddb = db.db(db_);
	let drop_db_result = null;
	try {
		drop_db_result = await ddb.dropDatabase();
	} catch(error) {
		utils.logData('Error dropping database: ',error);		
	}
	
	utils.logData(`Dropped ${db_} database.`)
	return drop_db_result;
}

async function dropCollection(db_,col) {
	let dcol = db.db(db_);
	let drop_col_result = null;
	try {
		drop_col_result =  await dcol.collection(col).drop();	
	} catch(error) {
		utils.logData('Error dropping collection: ',error);			
	}
	
	utils.logData(`Dropped ${col} collection`)
	return drop_col_result;
}

//almost like insert one but we define a database here
async function insertNewDoc(db_,col,doc) {
	let idb = db.db(db_);
	let insert_new_doc_result = null;
	try {
		insert_new_doc_result = await idb.collection(col).insertOne(doc);
	}catch(error) {
		console.log(error);	
	}
	
	return insert_new_doc_result['ops'][0];
}

async function updateDocument(db_,collection,oid,values) {
	let uddb = db.db(db_);
	let update_result = null;
	try {
		update_result = await uddb.collection(collection).updateOne({_id: ObjectId(oid)}, {$set: values});
	}catch(error) {
		console.log(error);
	} 
	return update_result;
}

async function insertMany(db_,collection,data) {
	let imdb = db.db(db_);
	let insert_many_result = await imdb.collection(collection).insertMany(data);
	
	return insert_many_result;
}

module.exports = {
	findOne,
	insertOne,
	updateOne,
	deleteOne,
	deleteMany,
	
	AuthenticateUser,
	storeCSRFSession,
	
	gcLCIDs,
	gcBypassTokens,	
	
	/* Database Interface Functions */
	getDatabases,
	getCollections,
	getDocuments,
	createDatabase,
	createCollection,
	dropDatabase,
	dropCollection,
	
	insertMany,
	insertNewDoc,
	updateDocument,
}