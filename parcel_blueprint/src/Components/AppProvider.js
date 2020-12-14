import React, { useState, useEffect, createContext } from 'react';

export const AppContext = createContext()
export default function({children, start}) {	
	/*Websocket Com's */
	const [ rs, setRs ] = useState(0);
	const [ ws, setWs ] = useState(null);
	
	const [ wsId, setWsId ] = useState(null);
	const [ CSRFToken, setCSRFToken ] = useState(null);
	
	
	/* KEYBOARD AND HALO */
	const [ shiftDown, setShiftDown ] = useState(false);
	
	const [ HaloCount, setHaloCount ] = useState(5);
	const [ HaloCells, setHaloCells ] = useState([]);
	
	const [ HaloIndex, setHaloIndex ] = useState(0);
	const [ HaloTheta, setHaloTheta ] = useState(null);
	const [ HaloRadius, setHaloRadius ] = useState(null);
	const [ microIndex, setMicroIndex ] = useState(1);
	
	const [ HaloZoom, setHaloZoom ] = useState(0);
	const [ HaloAngleCss, setHaloAngleCss ] = useState('rotateY(0deg)');
	const [ HaloZoomCss, setHaloZoomCss ] = useState('translateZ(0px)');
	const [ StaticHaloZoom, setStaticHaloZoom ] = useState(0);
	
	
	/* Application State */
	const [ state, setState ] = useState(false);
	const [ loading, setLoading ] = useState(true); //CHANGE TO FALSE TO FIRE WEBSOCKETS
	
	const [ user, setUser ] = useState(null);
	const [ LCID, setLCID ] = useState(null);
	const [ AccessToken, setAccessToken ] = useState(null);
	const [ AccessTokenVerified, setAccessTokenVerified ] = useState(null);
	const [ bypassToken, setBypassToken ] = useState(null);
	
	//Serves As Node Database Context Provider
	const [ databases, setDatabases ] = useState(null);
	const [ collections, setCollections ] = useState(null);
	const [ documents, setDocuments ] = useState(null);
	const [ insertedDocument, setInsertedDocument ] = useState(null);
	
	const request = async (jwt, type, data) => {
		let payload = {
			csrf: CSRFToken,
			jwt, //contains access_token && lcid (so we can decrypt this token)
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
				(ws.readyState !== 3) ? heartbeat(ws) : console.log('Closed Websocket');				
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
					case "client-websocket-id":
						setWsId(tjo['data']);
						break;
					case "client-websocket-csrf_token":
						setCSRFToken(tjo['data']);
						break;
					case "bypass-token":
						setBypassToken(tjo['data']);
						break;
					case "kill-credz": //future, fallthrough
					case "csrf-kill-signal":
						setAccessToken(null);
						setBypassToken(null);
						ws.close();
						setWs(null);
						setWsId(null);
						setCSRFToken(null);
						setUser(null);
						setLCID(null);
						setAccessTokenVerified(null);
						localStorage.removeItem('LCID');
						/*
							we could sent a cookie from server at this point that overrites the secure one on client...
						*/
						break;
					//Databse Interface Services
					case "requested-databases":
						setDatabases(tjo['data']);
						break;
					case "requested-collections":
						setCollections(tjo['data']);
						break;
					case "requested-documents":
						setDocuments(tjo['data']);
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
			
			//send initialization request here if you want...
			//request('node-client-test-msg','hello go server form client');
		}

	}
	
	
	/* Halo Stuff */
	const doRotate = (anInt) => {
		setHaloIndex(HaloIndex + anInt);
		if(anInt == -1) {
			((microIndex - 1) === 0) ? setMicroIndex(HaloCount) : setMicroIndex(microIndex - 1)
		}
		if(anInt == 1) {
			((microIndex + 1) === (HaloCount + 1)) ?setMicroIndex(1) : setMicroIndex(microIndex + 1);
		}
	}
	
	useEffect(() => {
		let theta = 360 / HaloCount;
		setHaloTheta(theta);
		
		let cz = window.innerWidth;
		let r = Math.round( (cz / 2) / Math.tan( Math.PI / HaloCount))
		setHaloRadius(r);
		
		let nhcts = []; //new halo cell tranlates
		for ( var i=0; i < HaloCount; i++) {
			let ca = theta * i; //cell angle
			nhcts[i] = 'rotateY(' + ca + 'deg) translateZ(' + r + 'px)';
		}
		console.log(nhcts);
		
		setHaloCells( [ ...nhcts] );
		
		setStaticHaloZoom(-r);
		if(loading === true) { r = r + 500; }
	
		setHaloZoomCss('translateZ(' + -r + 'px)');
		
		setHaloIndex(0);
		setMicroIndex(1);
	},[HaloCount]);	
	
		
	/* Keyboard Stuf */
	const handleKeyUpEvent = async(key_event) => {
		if(key_event.type == "keyup") {
			switch(key_event.key) {
				case 'Escape':
					setState(!state);
					break;
				case 'Shift':
					setShiftDown(false);
					break;
				case 'Enter':
					break;
				case 'ArrowLeft':
					break;
				case 'ArrowRight':
					break;
				case 'ArrowDown':
					break;
				case 'ArrowUp':
					break;					
			}	
		}	
	}
		
	const handleKeyDownEvent = async(key_event) => {
		if(key_event.type == "keydown") {
			switch(key_event.key) {
				case 'Escape':
					break;
				case 'Shift':
					setShiftDown(true);
					break;
				case 'Enter':
					break;
				case 'ArrowLeft':
				case 'ArrowRight':
				case 'ArrowDown':
				case 'ArrowUp':
					if(key_event.shiftKey === true && event.key == 'ArrowLeft') { doRotate(-1); }
					if(key_event.shiftKey === true && event.key == 'ArrowRight') { doRotate(1); }
					break;	
				default:
					break;				
			}	
		}			
	}
	
	useEffect(() => {
		if(shiftDown === true) {
			let nzv = StaticHaloZoom + -HaloZoom; //new zoom value
			setHaloZoomCss('translateZ(' + nzv + 'px)');
		}
		else if(shiftDown === false && HaloZoom !== 0) {
			let nzv = StaticHaloZoom + HaloZoom;
			setHaloZoomCss('translateZ(' + nzv + 'px)');
		}
	},[shiftDown]);
			
	useEffect(() => {
		let angle = HaloTheta * HaloIndex * -1;
		setHaloAngleCss('rotateY('+angle+'deg)');
	},[HaloIndex])
	
	

	useEffect(() => {
		if(loading === false) {
			setHaloZoomCss('translateZ(' + StaticHaloZoom + 'px)');
			start.play();
		}
	},[loading]);	
	
	useEffect(() => {
		window.addEventListener("keyup", handleKeyUpEvent);
		return () => {
			window.removeEventListener("keyup", handleKeyUpEvent);
		}
	},[handleKeyUpEvent]);
	
	useEffect(() => {
		window.addEventListener("keydown", handleKeyDownEvent);
		return () => {
			window.removeEventListener("keydown", handleKeyDownEvent);
		}		
	},[handleKeyDownEvent]);
	
	/* Run websocket after load */
	useEffect(() => {
		if(!loading && AccessToken !== null && CSRFToken === null) {
			console.log('Configure Master Js Socket Server...');
			if(ws === null) { setWs(new WebSocket('wss://caos.pr0con.com:1300/ws'));}
			if(ws !== null && rs === 0) { configureWebsocket(); heartbeat(ws); }
		}
	},[loading, AccessToken, ws, rs]);
	
	useEffect(() => {
		if(AccessToken !== null && CSRFToken !== null) {
			request({access_token: AccessToken, lcid: LCID}, 'verify-access-token', null);
		}
	},[CSRFToken]);
	
	
	/* Utility Functions */
	const sleep = (milliseconds) => {
		return new Promise(resolve => setTimeout(resolve, milliseconds))
	}	
	
	const getPathLength = (path) => {
		const length = path.getTotalLength();
		const actualWidth = path.getBoundingClientRect().width;
		const realWidth = path.getBBox().width;
		
		const scale = actualWidth / realWidth || 1;
		
		return length * scale;
	}
	
	const LogOut = () => {
		setAccessToken(null);
		setBypassToken(null);
		(ws !== null) ? ws.close() : '';
		setWs(null);
		setWsId(null);
		setCSRFToken(null);
		setUser(null);
		setLCID(null);
		setAccessTokenVerified(null);
		localStorage.removeItem('LCID');
	}
	useEffect(() => { (rs === 3) ? setRs(0) : '';},[rs]);
	
	return(
		<AppContext.Provider value={{
			rs,
			wsId,
			CSRFToken,
			request,
			
			HaloCount,
			HaloCells,
			microIndex,
			setHaloIndex,
			HaloZoomCss,
			HaloAngleCss,
			
			state,
			loading,
			setLoading,
			
			user, 
			setUser,
			LCID,
			setLCID,
			AccessToken,
			setAccessToken,
			LogOut,
			
			bypassToken,
			
			//utility functions
			sleep,
			getPathLength,
			
			//Node Database Context Services
			databases,
			collections,
			setCollections,
			documents,
			setDocuments,
			insertedDocument,
			setInsertedDocument,	
		}}>
			{children}
		</AppContext.Provider>
	)
}