package procon_jwt

import(
	"fmt"
	"crypto/rsa"
	
	jwtgo "github.com/dgrijalva/jwt-go"
)

type CustomClaims struct {
	Wsid string `json:"wsid"`
	jwtgo.StandardClaims
}

func ValidateJWT(pkf *rsa.PublicKey, jwt string) (bool,error){
	token, err := jwtgo.Parse(jwt, func(token *jwtgo.Token) (interface{}, error) {
		return pkf, nil	
	})
	if err != nil { return false, nil } else if (token.Valid && err == nil) { return true, nil }
	
	return false, nil
}

func ValidateJWTClaims(pkf *rsa.PublicKey, wsid string, jwt string) (bool,error) {
	Claims := CustomClaims{}
	
	token, err := jwtgo.ParseWithClaims(jwt, &Claims, func(token *jwtgo.Token) (interface{}, error) {
		return pkf, nil
	})
	
	if err == nil {
		if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
			fmt.Printf("Checking Token Wsid == c.Wsid %v = %v ... ? \n", claims.Wsid, wsid)
			if(claims.Wsid == wsid) {
				return true, nil
			}else {
				return false, nil
			}
		}
	}else if err != nil	{
		return false, nil
	}
	
	return false, nil
}