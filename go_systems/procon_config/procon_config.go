package procon_config

import(
	"fmt"
	"crypto/rsa"
	
	jwtgo "github.com/dgrijalva/jwt-go"
	
	"go-systems/procon_fs"
)

var(
	PubKeyFile *rsa.PublicKey
	PrivKeyFile *rsa.PrivateKey
)

const(
	PKPWD = "SOMEHARDPASSWORD"
	
	PubKeyPath = "/var/www/keycertz/mykey.pub"
	PrivKeyPath = "/var/www/keycertz/mykey.pem"
	
	MongoHost = "127.0.0.1"
	MongoUser = "mongod"
	MongoPassword = "SOMEHARDPASSWORD"
	MongoDb = "admin"
)


func init() {
	f, ok, err := procon_fs.ReadFile(PubKeyPath)
	if (!ok || err != nil) { fmt.Println(err) } else {
		PubKeyFile, err = jwtgo.ParseRSAPublicKeyFromPEM(f)
		if err != nil { fmt.Println(err) }
	}
	
	f, ok, err = procon_fs.ReadFile(PrivKeyPath)
	if (!ok || err != nil) { fmt.Println(err) } else {
		PrivKeyFile, err = jwtgo.ParseRSAPrivateKeyFromPEMWithPassword(f, PKPWD)
		if err != nil { fmt.Println(err) }		
	}
}