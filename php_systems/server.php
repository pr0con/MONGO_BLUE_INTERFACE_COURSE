<?php
	use Swoole\WebSocket\Server;
	use Swoole\Http\Request;
	use Swoole\WebSocket\Frame;
	
	include("./chilkat-php/chilkat_9_5_0.php");
	include("./chilkat_unlock.php");
	unlock_chilkat();
	
	include("./utilz.php");
	
	require_once './vendor/autoload.php';


	
	$server = new Server("127.0.0.1",1700);	
	$server->on("start", function (Server $server) {
	    echo "Swoole WebSocket Server is started at http://127.0.0.1:1700\n";
	});
	
	$server->on('open', function(Server $server, Swoole\Http\Request $request) {
	    echo "connection open: {$request->fd}\n";
	    
	    /*
	    $server->tick(1000, function() use ($server, $request) {
	        $server->push($request->fd, json_encode(["hello", time()]));
	    });
	    */
	    
	    //print_r($server);
	});
	
	$server->on('message', function(Server $server, Frame $frame) {
	    //print_r($server)
	    //echo "received message: {$frame->data}\n";
	    
	    //Test incoming message string to json object
	    $message = json_decode("{$frame->data}");
	    //print_r($message, true);
	    //var_dump($message);
	
		//NEED TO MAKE PERSIST AS GLOBAL OUTSIDE THIS FUNCTION
		$client = new MongoDB\Client(
		    'mongodb://127.0.0.1',
		    [
		        'username' => 'mongod',
		        'password' => 'SOMEHARDPASSWORD',
		        'authSource' => 'admin', 
		    ]
		);	    
	    
	    
	    //echo $message->type;
	    if(validate_jwt_token($message->jwt, $message->wsid)) {
		    switch($message->type) {
				case "get-databases":
					$databases = [];
					
					//OOPS THIS IS JUST A PACKET dont pay attention to jwt_ in name... just a packet	
					$jwt_packet = [];
					$jwt_packet["type"] = "requested-databases";
					
						
					foreach ($client->listDatabaseNames() as $databaseName) {
					    array_push($databases, $databaseName);
					}	
					
					$jwt_packet["data"] = $databases;
					$server->push($frame->fd, json_encode($jwt_packet));
					break;
		    }
	    }else {
		   //Close Websockeg
	    }
	    
	   
	});
	
	$server->on('close', function(Server $server, int $fd) {
	    echo "connection close: {$fd}\n";
	});
	
	$server->start();
?>