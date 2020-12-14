import React, { useState, useEffect, createContext } from 'react';

export const PHPContext = createContext()
export default function(props) {
	/*Websocket Com's */
	const [ rs, setRs ] = useState(0);
	const [ ws, setWs ] = useState(null);
	const [ wsId, setPHPWsId ] = useState(null);
	const [ bypassToken, setPHPBypassToken ] = useState(null);
	
	const [ databases, setDatabases ] = useState(null);
	const [ collections, setCollections ] = useState(null);
	const [ documents, setDocuments ] = useState(null);
	const [ insertedDocument, setInsertedDocument ] = useState(null);	
	
	const request = async (type,data) => {
		let payload = {
			jwt: bypassToken,
			wsid: wsId,
			type,
			data
		};
		ws.send(JSON.stringify(payload));
	}
	
	const heartbeat = async (ws) => {
		setTimeout(
			function() {
				//console.log(ws.readyState);
				/*  0 	CONNECTING 	Socket has been created. The connection is not yet open.
					1 	OPEN 	The connection is open and ready to communicate.
					2 	CLOSING 	The connection is in the process of closing.
					3 	CLOSED 	The connection is closed or couldn't be opened.	
				*/
				if (rs !== ws.readyState) { setRs(ws.readyState); }
				(ws.readyState !== 3) ? heartbeat(ws) : console.log('Closed PHP Websocket...');			
			}
			.bind(this),
			1000
		)
	}
	
	const configureWebsocket = async () => {
		ws.onopen = function(open_event) {
			console.log(open_event);
			ws.onmessage = function(msg_event) {
				console.log(msg_event);
				let tjo = JSON.parse(msg_event.data);
				
				switch(tjo['type']) {
					case "requested-databases":
						setDatabases(tjo['data']);
						break;
					case "requested-collections":
						setCollections(tjo['data']);
						break;
					case "requested-documents":
						(Array.isArray(tjo['data'])) ? setDocuments(tjo['data']) : setDocuments([tjo['data']]);
						break;
					case "inserted-document":
						setInsertedDocument(tjo['data']);
						break;						
					default:
						break;
				}				
			}
			ws.onclose = function(close_event) {
				console.log(close_event);
			}
			ws.onerror = function(error_event) {
				console.log(error_event);
			}
			
			//request('set-ws-id', wsId);
		}
	}
	

	useEffect(() => {
		if(wsId !== null && bypassToken !== null) {
			if(ws === null) { setWs(new WebSocket('wss://caos.pr0con.com:1701'));}
			if(ws !== null && rs === 0) { configureWebsocket(); heartbeat(ws); }
		}
	},[bypassToken, ws, rs]);
			
	return(
		<PHPContext.Provider value={{
			rs,
			wsId,
			request,
			setPHPWsId,
			setPHPBypassToken,
			
			databases, 
			collections,
			setCollections,
			documents,
			setDocuments,
			insertedDocument, 
			setInsertedDocument,
		}}>
			{props.children}
		</PHPContext.Provider>
		
	)
}