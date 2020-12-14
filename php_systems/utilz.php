<?php
/*
	create document db and collection source
	//New Test Mongo COnnection
	$collection = $client->NEWDB->NEWCOLLECTION;
	//just test data from docs
	$insertOneResult = $collection->insertOne([
	    'username' => 'admin',
	    'email' => 'admin@example.com',
	    'name' => 'Admin User',
	]);
	
	printf("Inserted %d document(s)\n", $insertOneResult->getInsertedCount());
	
	var_dump($insertOneResult->getInsertedId());		
	*/
	
	
	function validate_jwt_token($token, $wsid) {
		$pubKey = new CkPublicKey();
		$success = $pubKey->LoadFromFile('/var/www/keycertz/mykey.pub');
		
		$jwt = new CkJwt();
			
		//  First verify the signature.
		$sigVerified = $jwt->VerifyJwtPk($token,$pubKey);
		//print 'verified: ' . $sigVerified . "\n";
		
		//  Let's see if the time constraints, if any, are valid.
		//  The above JWT was created on the afternoon of 16-May-2016, with an expiration of 1 hour.
		//  If the current system time is before the "nbf" time, or after the "exp" time,
		//  then IsTimeValid will return false/0.
		//  Also, we'll allow a leeway of 60 seconds to account for any clock skew.
		//  Note: If the token has no "nbf" or "exp" claim fields, then IsTimeValid is always true.
		$leeway = 60;
		$bTimeValid = $jwt->IsTimeValid($token,$leeway);
		//print 'time constraints valid: ' . $bTimeValid . "\n";
		
		//  Now let's recover the original claims JSON (the payload).
		$payload = $jwt->getPayload($token);
		//  The payload will likely be in compact form:
		//print $payload . "\n";
		
		//  We can format for human viewing by loading it into Chilkat's JSON object
		//  and emit.
		$json = new CkJsonObject();
		$success = $json->Load($payload);
		$json->put_EmitCompact(false);
		//print $json->emit() . "\n";
		$JWT = json_decode("{$json->emit()}");
		
		
		/*
			//  We can recover the original JOSE header in the same way:
			$joseHeader = $jwt->getHeader($token);
			//  The payload will likely be in compact form:
			//print $joseHeader . "\n";
			
			//  We can format for human viewing by loading it into Chilkat's JSON object
			//  and emit.
			$success = $json->Load($joseHeader);
			$json->put_EmitCompact(false);
			//print $json->emit() . "\n";
		*/
		
		
		
		if ($sigVerified && ($JWT->wsid === $wsid)) {
			//echo $JWT->wsid;
			return true;
		}
		
		return false;		
	}
?>