package procon_mongo

import(
	"fmt"
	"strconv"
	"context"
	"encoding/json"
	
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/x/bsonx"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/bson/primitive"
	
	"go-systems/procon_data"
	"go-systems/procon_config"
)

type key string

const(
	HostKey = key("hostKey")
	UsernameKey = key("usernameKey")
	PasswordKey = key("passwordKey")
	DatabaseKey = key("databaseKey")
)

var ctx context.Context
var client *mongo.Client

func init() {
	ctx = context.Background()
	ctx, cancel := context.WithCancel(ctx)
	
	defer cancel()
	
	ctx = context.WithValue(ctx, HostKey, procon_config.MongoHost)
	ctx = context.WithValue(ctx, UsernameKey, procon_config.MongoUser)
	ctx = context.WithValue(ctx, PasswordKey, procon_config.MongoPassword)
	ctx = context.WithValue(ctx, DatabaseKey, procon_config.MongoDb)
	
	uri := fmt.Sprintf(`mongodb://%s:%s@%s/%s`,
		ctx.Value(UsernameKey).(string),
		ctx.Value(PasswordKey).(string),
		ctx.Value(HostKey).(string),
		ctx.Value(DatabaseKey).(string),
	)
	clientOptions := options.Client().ApplyURI(uri)
	
	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	
	err = client.Ping(ctx,nil)
	if err != nil { fmt.Println(err) }else {
		fmt.Println("Mongo Connected")
	}
}		

func GetBypassTokenRecord(wsid string) (bool) {
	fmt.Println("Checking for valid Bypass Token Record for WsId: ",wsid)
	
	var record procon_data.BypassTokenRecord
	
	filter := bson.M{"wsid": bson.M{"$eq": wsid}}
	err := client.Database("api").Collection("bypass_tokens").FindOne(ctx, filter).Decode(&record)
	
	if err != nil {
		fmt.Println("Bypass Token Record Error: ",err.Error())
		return false
	}
	
	fmt.Printf("Found Bypass Token Record: %v\n",record)
	return true
}

func GetMongoDbs( ) string {
	db_names, err := client.ListDatabaseNames(ctx, bsonx.Doc{})
	
	if err != nil {
		fmt.Println("Get Db List Error: ", err)
	}
	
	j_db_names, err := json.Marshal(db_names)
	
	if err != nil {
		return "[\""+err.Error()+"\"]"
	}	
	return string(j_db_names)
}



func GetDatabaseCollections(db string) string {
	api := client.Database(db)
	collections_names, err := api.ListCollectionNames(ctx, bsonx.Doc{})
	
	if err != nil {
		fmt.Println("Get Db Collection List Error: ", err)
	}
	
	j_collections_names, err := json.Marshal(collections_names)
	if err != nil {
		return "[\""+err.Error()+"\"]"
	}
	
	return string(j_collections_names)
}

func GetDocuments(db string, col string) string {
	var docs []interface{}
	
	collection := client.Database(db).Collection(col)
	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		fmt.Println("Error collecting documents", err.Error())
	}
	
	defer cursor.Close(ctx) //wait till done then close cursor
	
	for cursor.Next(ctx) {
		var xdoc map[string]interface{}
		err = cursor.Decode(&xdoc)
		
		if err != nil {
			fmt.Println("Error decoding cursor doc", err.Error())
		}else {
			docs = append(docs, xdoc)
		}
	}
	
	jsonStr, err := json.Marshal(docs)
	if err != nil {
		fmt.Println(err)
		return "[]"
	}
	
	return string(jsonStr)
}

func CreateDatabase(db string) {
	collection := client.Database(db).Collection("init") //need to add collection with @least 1 doc
	insertResult, err := collection.InsertOne(ctx, bsonx.Doc{{"init", bsonx.String("true")}})
	if err != nil {
		fmt.Println("Error Creating Database: ",err.Error())
		return
	}
	_ = insertResult
	fmt.Println("Created Database ",db)
}

func CreateCollection(db string, col string) {
	collection := client.Database(db).Collection(col) //need to add collection with @least 1 doc
	insertResult, err := collection.InsertOne(ctx, bsonx.Doc{{"init", bsonx.String("true")}})
	if err != nil {
		fmt.Println("Error Creating Collection: ",err.Error())
		return
	}
	_ = insertResult
	fmt.Println("Created Collection ",col," in ",db)	
}

func DropDatabase(db string) {
	_ = client.Database(db).Drop(ctx)
}

func DropCollection(db string, col string) {
	_ = client.Database(db).Collection(col).Drop(ctx)
}

func InsertDocument(db string, col string, doc string) string {
	var xdoc map[string]interface{}
	err := json.Unmarshal([]byte(doc), &xdoc)
	
	if err != nil {
		fmt.Println("Error Unmarshalling document: ", err.Error())
		return "WTF"
	}
	
	collection := client.Database(db).Collection(col)
	insertResult, err := collection.InsertOne(ctx, &xdoc)
	
	if err != nil {
		fmt.Println("Error Inserting Document. ", err.Error())
		return "WTF"
	}
	
	//OLD
	//return insertResult.InsertedID.(primitive.ObjectID).Hex()
	
	//NEW RETURN INSERTED DOCUMENT
	//var inserted_document interface{} <-- will return key value pairs in doc
	var inserted_document map[string]interface{}
	filter := bson.D{{"_id", insertResult.InsertedID.(primitive.ObjectID) }}
	
	err = collection.FindOne(ctx, filter).Decode(&inserted_document)
	if err != nil {
		return "WTF"
	}
	
	jsonStr, _ := json.Marshal(inserted_document)
	return string(jsonStr)	
}

func InsertMany(db string, col string, docs string) {
	var xdocs []interface{}
	//var xdocs []interface{}
	//var xdocs []map[string]interface{}
	
	s, err := strconv.Unquote(string(docs))
	if err != nil { fmt.Println(err); return }
	
	err = json.Unmarshal([]byte(s), &xdocs)
	if err != nil { fmt.Println(err); return }
	
	collection := client.Database(db).Collection(col)
	insertManyResult, err := collection.InsertMany(ctx, xdocs)
	if err != nil { fmt.Println(err); return }
	
	fmt.Println("Inserted Multiple Documents: ", insertManyResult.InsertedIDs)
}

func UpdateOne(db string, col string, oid string, values string) {
	var xdoc map[string]interface{}
	err := json.Unmarshal([]byte(values), &xdoc)
	if err != nil { fmt.Println(err); return }
	
	collection := client.Database(db).Collection(col)
	
	docId, err := primitive.ObjectIDFromHex(oid)
	if err != nil { fmt.Println(err); return }
	
	options := options.Update().SetUpsert(false)
	filter := bson.D{{"_id", docId }}
	update_result, err := collection.UpdateOne(ctx,filter,xdoc, options)
	
	if err != nil { fmt.Println(err); return }

	if update_result.MatchedCount != 0 {
	    fmt.Println("Updated Document")
	}	
}


