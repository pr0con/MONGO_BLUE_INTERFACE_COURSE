import sys
import json
import asyncio
import chilkat2

jwt = chilkat2.Jwt()
pubKey = chilkat2.PublicKey()
success = pubKey.LoadFromFile('/var/www/keycertz/mykey.pub')

def dump(obj):
	for attr in dir(obj):
		print("obj.%s = %r" % (attr, getattr(obj, attr)))


def ck_unlock():
	glob = chilkat2.Global()
	success = glob.UnlockBundle("Anything for 30-day trial")
	if (success != True):
	    print(glob.LastErrorText)
	    sys.exit()
	
	status = glob.UnlockStatus
	if (status == 2):
	    print("Unlocked using purchased unlock code.")
	else:
	    print("Unlocked in trial mode.")
	
	# The LastErrorText can be examined in the success case to see if it was unlocked in
	# trial more, or with a purchased unlock code.
	print(glob.LastErrorText)
	
async def verifyJWT(wsid, bypassToken):
	sigVerified = jwt.VerifyJwtPk(bypassToken,pubKey)
	print("verified: " + str(sigVerified))
	
	leeway = 60
	bTimeValid = jwt.IsTimeValid(bypassToken,leeway)
	#print("time constraints valid: " + str(bTimeValid))	
	
	payload = jwt.GetPayload(bypassToken)
	#print(payload)
	
	ck_json = chilkat2.JsonObject()
	success = ck_json.Load(payload)
	ck_json.EmitCompact = False
	#print(json.Emit())
	
	print("Checking "+wsid+" is equal to wsid in token");
	wsid_in_token = ck_json.StringOf("wsid")
	
	#second check for corrent wsid
	if wsid_in_token == wsid:
		if bTimeValid:
			return sigVerified
		else:
			return False
	else:
		return False
		
	