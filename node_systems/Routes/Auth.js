const utils = require('../utilz.js');
const mongo = require('../mongo.js');
const router = require('express').Router();
const ObjectId = require('mongodb').ObjectID;


router.post('/api/auth/login', async (req,res) => {
	if([req.body.username, req.body.password].includes('')) {
		return res.status(400).json({success: false, message: 'User not found'});
	}
	
	let tokens_with_user = null;
	tokens_with_user = await mongo.AuthenticateUser(req.body);
	
	if(tokens_with_user !== false && tokens_with_user !== null) {
		let nd = new Date().toISOString();
		tokens_with_user['user']['last_login'] = nd;
		
		//update: ullr = user last login result..
		let ullr = await mongo.updateOne('users', {'_id': new ObjectId(tokens_with_user['user']['_id'])}, {'$set': {'last_login': nd}});
		utils.logData(`${ullr} user logged in or modified.`);
		
		res.cookie('refresh_token', tokens_with_user['refresh_token'], {expires: new Date(Date.now() + 86400000), httpOnly: true, secure: true});
		res.status(200).json({
			succes: true, message: 'User logged in.', 
			lcid: tokens_with_user['lcid'], 
			access_token: tokens_with_user['access_token'],
			user: tokens_with_user['user']
		});
		
	} else {
		res.status(401).json({success: false, message: 'Horrific Credz'});		
	}
});

router.post('/api/auth/refresh_token', async (req, res) => {
	if('grant_type' in req.body && req.body.grant_type === "refresh_token") {	
		if('refresh_token' in req.cookies) {
			let lcid_record = await mongo.findOne('LCIDs', {lcid: req.body.LCID});
			//console.log(lcid_record);
				
			if (lcid_record) {
				let decrypted_refresh_token = await utils.decryptData(req.cookies.refresh_token, lcid_record.iv.buffer, lcid_record.key.buffer);
				let vrt = await utils.verifyRefreshToken(decrypted_refresh_token);
				if(vrt) {
					let fresh_user = await mongo.findOne('users', {'_id': ObjectId(vrt.user._id)});
					
					delete fresh_user['password'];
					
					//if you want a new refresh token here you can... but lcid will expire 24h regardless...
					let access_token = await utils.generateJwt(fresh_user, 'ACCESS_TOKEN');
					//let refresh_token = await utils.generateJWT(fresh_user, 'REFRESH_TOKEN');
							
					let encrypted_access_token = await utils.encryptData(access_token, lcid_record.iv.buffer, lcid_record.key.buffer);
					//let encrypted_refresh_token = await utils.encryptData(refresh_token, lcid_record.iv.buffer, lcid_record.key.buffer);
					
					//if you want to send new refresh_token cookie
					//res.cookies('refresh_token',encrypted_refresh_token, { expires: new Date(Date.now() + 86400000), httpOnly: true, secure: true });	
					res.status(200).json({success: true, message: "User session refreshed.", access_token: encrypted_access_token, user: fresh_user});
						
				}else {
					res.status(200).json({success: false, code:'bad-refresh-token-verification', message: 'Bad Refresh Token Verification.'});
				}
			}else {
				//up to you: send a cookie that invalidates current refresh_token cookie
				res.status(200).json({success: false, code:'missing-or-invalid-lcid', message: 'Missing / Invalid LCID'});
			}
		}else {
			res.status(200).json({success: false, code:'missing-refresh-token', message: 'Missing Refreh Token'});
		}
	}else {
		res.status(200).json({success: false, code:'missing-or-invalid-grant-type', message: 'Missing or Invalid Grant Type'});
	}	
});

module.exports = router;



