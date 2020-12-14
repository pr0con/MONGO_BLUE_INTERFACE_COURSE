package main

import(
	"fmt"
	"flag"
	"net/http"
	"encoding/json"
	
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	
	"go-systems/procon_jwt"
	"go-systems/procon_data"
	"go-systems/procon_mongo"
	"go-systems/procon_config"
)

var addr = flag.String("addr", "0.0.0.0:1200", "Http service address")
var upgrader = websocket.Upgrader{}

func validateBypassToken(wsid string, jwt string, c *websocket.Conn) (bool) {
	if procon_mongo.GetBypassTokenRecord(wsid) {
		valid, err := procon_jwt.ValidateJWT(procon_config.PubKeyFile, jwt)
		if err != nil { fmt.Println(err); procon_data.SendMsg("jwt-token-invalid", err.Error(), c) } else if (err == nil && valid) {
			valid_claims, err := procon_jwt.ValidateJWTClaims(procon_config.PubKeyFile, wsid, jwt)
			if err != nil { fmt.Println(err); procon_data.SendMsg("jwt-token-invalid", err.Error(), c) }else if (err == nil && valid_claims) {
				return true
			}
		}
	}
	c.Close()
	return false
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool {
		//Check origin is our server later
		fmt.Println("Origin: ",r.Header["Origin"][0])
		
		if r.Header["Origin"][0] == "https://caos.pr0con.com" {
			return true
		}
		return false
	}
	
	c, err := upgrader.Upgrade(w,r, nil)
	if err != nil {
		fmt.Println("WTF @handleAPI func")
		return
	}
	
	Loop:
		for {
			in := procon_data.MsgIn{}
			err := c.ReadJSON(&in)
			if err != nil {
				fmt.Println("ws-read-error: ",err.Error())
				c.Close()
				break Loop
			}
			
			//you dont need the breaks technilcally golang has a fallthrough keyword
			//it makes me feel fuzzy warm seeing them....
			switch(in.Type) {
				case "set-ws-id":			
					c.WsId = in.Data
					fmt.Println("Register "+c.WsId)
					if validateBypassToken(c.WsId, in.Jwt, c) {
						fmt.Println("Registered & Validated Websocket Client")
					} 
					break;
				case "get-databases":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						procon_data.SendMsg("requested-databases", procon_mongo.GetMongoDbs(), c)
					}
					break;
				case "get-collections":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						procon_data.SendMsg("requested-collections", procon_mongo.GetDatabaseCollections(in.Data), c)	
					}
					break;
				case "get-documents":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						var tmp map[string]string
						_ = json.Unmarshal([]byte(in.Data), &tmp)
						//fmt.Println(tmp)
						procon_data.SendMsg("requested-documents", procon_mongo.GetDocuments(tmp["db"],tmp["col"]), c)			
					}
				case "create-database":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						procon_mongo.CreateDatabase(in.Data)
						procon_data.SendMsg("requested-databases", procon_mongo.GetMongoDbs(), c)	
					}
					break;
				case "create-collection":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						var tmp map[string]string
						_ = json.Unmarshal([]byte(in.Data), &tmp)
						procon_mongo.CreateCollection(tmp["db"], tmp["col"])
						
						procon_data.SendMsg("requested-collections", procon_mongo.GetDatabaseCollections(tmp["db"]), c)	
					}
					break;
				case "drop-database":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						procon_mongo.DropDatabase(in.Data)
						procon_data.SendMsg("requested-databases", procon_mongo.GetMongoDbs(), c)
					}
					break;
				case "drop-collection":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						var tmp map[string]string
						_ = json.Unmarshal([]byte(in.Data), &tmp)
						procon_mongo.DropCollection(tmp["db"],tmp["col"])
						
						procon_data.SendMsg("requested-collections", procon_mongo.GetDatabaseCollections(tmp["db"]), c)
					}
					break;
					
				case "insert-document":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						var tmp map[string]string
						_ = json.Unmarshal([]byte(in.Data), &tmp)
					
						inserted_doc := procon_mongo.InsertDocument(tmp["db"], tmp["col"], tmp["doc"])
						fmt.Println(inserted_doc)
						
						procon_data.SendMsg("requested-documents", procon_mongo.GetDocuments(tmp["db"],tmp["col"]), c)
						procon_data.SendMsg("inserted-document", inserted_doc, c)
					}
					break;
				case "insert-many":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						var tmp map[string]string
						_ = json.Unmarshal([]byte(in.Data), &tmp)
					
						procon_mongo.InsertMany(tmp["db"], tmp["col"], tmp["data"])
						procon_data.SendMsg("requested-documents", procon_mongo.GetDocuments(tmp["db"],tmp["col"]), c)											
					}
					break;
				case "update-document":
					if validateBypassToken(c.WsId, in.Jwt, c) {
						var tmp map[string]string
						_ = json.Unmarshal([]byte(in.Data), &tmp)
						
						procon_mongo.UpdateOne(tmp["db"], tmp["col"], tmp["oid"], tmp["values"])
						procon_data.SendMsg("requested-documents", procon_mongo.GetDocuments(tmp["db"],tmp["col"]), c)		
					}
					break;					
				default:
					fmt.Println("Unknown Operation.")
					break;
			}
		}
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/ws", handleAPI)	

	fmt.Println("Server Running | 0.0.0.0:1200")
	http.ListenAndServeTLS(*addr, "/etc/letsencrypt/live/caos.pr0con.com/cert.pem","/etc/letsencrypt/live/caos.pr0con.com/privkey.pem", r)
}

