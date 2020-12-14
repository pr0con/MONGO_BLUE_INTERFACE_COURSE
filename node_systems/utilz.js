//Native Packages
const os = require('os');
const fs = require('fs');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jwtDecode = require('jwt-decode');

const CSRFTokens = require('csrf');
const { v1: uuidv1 } = require('uuid');
const { v4: uuidv4 } = require('uuid');


const crypto = require("crypto");
const algorithm = "aes-192-cbc"; //algorithm to use
const password = "SOMEHARDPASSWORD";

const k3yc3r7 = {
	key: fs.readFileSync('/etc/letsencrypt/live/caos.pr0con.com/privkey.pem'),
	cert: fs.readFileSync('/etc/letsencrypt/live/caos.pr0con.com/cert.pem'),
}

const system_configuration = {
	"letsencrypt": {
		"public_key_path": "/etc/letsencrypt/live/caos.pr0con.com/fullchain.pem",
		"private_key_path": "/etc/letsencrypt/live/caos.pr0con.com/privkey.pem"
	},
	"databases": {
		"mongo": {
			"url": "mongodb://mongod:SOMEHARDPASSWORD@127.0.0.1:27017?authMechanism=SCRAM-SHA-1&authSource=admin",
		},
	},
	"oauth": {
		"jwt_secret": "SOMEHARDPASSWORD",
		"jwt_claims": {
			issuer: "caos.pr0con.com",
			audience: "caos.pr0con.com",
			expiresIn: "30m",
			jwtid: "",
			notBefore: "0",
			subject: "Development Services",
			algorithm: "RS256"
		},
		"at_verify_options": {
			
		},
		"rt_verify_options": {
			issuer: "caos.pr0con.com",
			subject: "Development Services",
			audience: "caos.pr0con.com",
			expiresIn: "ignored", //validated by function
			algorithms: ["RS256"],
		}
	}
}

var jwtPublicKey = fs.readFileSync('/var/www/keycertz/mykey.pub', 'utf8');
var jwtPrivateKey = fs.readFileSync('/var/www/keycertz/mykey.pem', 'utf8');

function logData(message) {
	let d = new Date();
	let time = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '] ';
	
	console.log(time + message);
}

function decodeBase64(data) {
	let buff = Buffer.from(data, 'base64');
	let text = buff.toString('ascii');
	return text	
}

async function bcryptValidatePassword(p,h) {
	return await bcrypt.compare(p,h);
}

async function generateJwt(user, token_type) {
	let claims = system_configuration['oauth']['jwt_claims'];
	claims['jwtid'] = uuidv1();
	
	let scopes = {
		api: 'restricted_access'
	}
	
	switch(user['role']) {
		case "admin":
			scopes['api'] = "admin_access";
			break;
		case "user":
			break;
		default:
			break;
	}
	
	switch(token_type) {
		case "ACCESS_TOKEN":
			//dont do anything
			break;
		case "REFRESH_TOKEN":
			//set 24hr expiration on claims...
			claims['expiresIn'] = '24h'
			break;
		default:
			break;
	}
	
	var token = jwt.sign({token_type,user, scopes}, {key: jwtPrivateKey, passphrase: system_configuration['oauth']['jwt_secret'] }, claims);
	return token;
}

async function verifyAccessToken(token) {
	try {
		let legit = jwt.verify(token, jwtPublicKey, system_configuration['oauth']['at_verify_options']);
		return legit; //should be true || false
	}catch(error) {
		console.log(error);
		return false;
	}
	return false; //shouldnt get here...
}

async function verifyRefreshToken(token) {
	try {
		//you can use this to verify options on your own or wait for legit then verify based on legit object
		//let decoded = jwtDecode(token);
		//console.log(decoded);
		
		//the verify funciton will error out with invalid expires timestamp
		let legit = jwt.verify(token, jwtPublicKey, system_configuration['oauth']['rt_verify_options']);		
		
		return legit;
	} catch(error) {
		console.log(error);
		return false;
	}
	return false; //shoudn't get here, safety net...
}

async function generateLifeCycleId() {
	const lcid = uuidv4();
	const iv = crypto.randomBytes(16); //different for every request
	const key = crypto.scryptSync(password, 'salt', 24);
	
	let d = new Date();
	let exp = d.setTime(d.getTime()+(60*60*24*1000));
	
	return {lcid, iv, key, exp}
}

async function encryptData(data,iv,key) {
	const cipher = crypto.createCipheriv(algorithm, key,iv);
	const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
	
	return encrypted;	
}

async function decryptData(data,iv,key) {
	const decipher = crypto.createDecipheriv(algorithm, key,iv);
	let decrypted = decipher.update(data,'hex','utf8') + decipher.final('utf8');
	
	return decrypted;
}
const csrfTokens = new CSRFTokens();
async function generateCSRFToken() {
	const secret = csrfTokens.secretSync();
	const token = csrfTokens.create(secret);
	
	return { csrf_token: token, csrf_secret: secret }
}

//be carefull we need to await promises in if statements !!!!!
//a promise will return true!!!!
async function verifyCSRFToken(csrf_token, csrf_secret) {
	if(!csrfTokens.verify(csrf_secret, csrf_token)) {
		logData('Invalid CSRFToken detected!')
		return false;
	} else if(csrfTokens.verify(csrf_secret, csrf_token)) {
		return true;		
	}	
	return false; //should never get here...
}


/* 
	Bypass Token Generation and Validation 
	- dont need verification here 
	- used by other servers (golang, python, php)
*/
async function createBypassToken(wsid) {
	bypass_claims = {
		issuer: "bypass.pr0con.com",
		audience: "bypass.pr0con.com",
		expiresIn: "30m",
		jwtid: uuidv1(),
		notBefore: "0",
		subject: "Development Services",
		algorithm: "RS256"		
	}
	
	let bypass_token = jwt.sign({wsid}, {key: jwtPrivateKey, passphrase: system_configuration['oauth']['jwt_secret']}, bypass_claims);
	return bypass_token;
}




module.exports = {
	k3yc3r7,
	system_configuration,
	
	logData,
	decodeBase64,
	
	bcryptValidatePassword,
	
	generateJwt,
	verifyAccessToken,
	verifyRefreshToken,
	generateLifeCycleId,
	
	encryptData,
	decryptData,
	
	ArrayBufferToString: function(buffer, encoding) {
		if(encoding == null) encoding = 'utf8';
		return Buffer.from(buffer).toString(encoding);
	},
	
	verifyCSRFToken,
	generateCSRFToken,
	
	createBypassToken,
}