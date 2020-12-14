import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import anime from 'animejs';
import styled from 'styled-components';

import { AppContext } from './AppProvider.js';
const StyledInit = styled.div`
	position: absolute;
	
	top: 0px;
	left: 0px;
	
	width: 100vw;
	height: 100vh;
	
	background: #000;
	
	transition: all .2s;
	
	#init-sound {
		position: absolute;
		top: 50%;
		left: 50%;
		
		width: 35rem;
		height: 11.4rem;
		
		transform: translate(-50%,-50%);
		z-index: 1;
		
		opacity: 1;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		
		#initialize-sound-svg {
			position: absolute;
			top:0px;
			left:0px;
			width: 100%;
			height: 100%;
			
			path {
				fill: transparent;
				stroke-width: 1;
				stroke: rgba(187,187,187,.5);
				
				stroke-dasharray: 85.8333px; stroke-dashoffset: 0px; 
				vector-effect: non-scaling-stroke;
			}	
		}
		
		
		&.true {
			transition: opacity 250ms ease-out;
			transition-delay: 250ms;
			opacity: 0;
			z-index: 9;
		}			
	}
	#init-auth {
		position: absolute;
		top: 50%;
		left: 50%;
		
		width: 50rem;
		height: 30rem;
		
	
		transform: translate(-50%,-50%);
		
		opacity: 0;
		z-index: 0;
		
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		
		#init-auth-border {
			position: relative;
			width: 0px;
			border: 0px;
		}		
		
		&.true {
			transition: opacity 250ms ease-in;
			transition-delay: 250ms;
			opacity: 1;			
			z-index: 10;
			
			#init-auth-border {
				transition: all 250ms;
				transition-delay: 500ms;
				width: 100%;
				border-width: 1px 0 0 0;	
				border-color: rgba(204,204,204, .5);
				border-style: solid;	
			}
			
			#init-auth-content {
				position: relative;
				flex-grow: 1;
				text-align:center;
			}	
		}
		
		
	}
	
	z-index: 10;
	
	&.load-complete {
		display: none;	
	}
`;

import { Type } from './Type.js';
import { UndecoratedButton } from './UndecoratedButton.js';

export function Init() {
	const [ initFinished, setInitFinished ] = useState(false);
	const [ sequence, setSequence ] = useState({
		load_auth_req_content: false,
		refresh_tokens_success: null,
	});
	const [ audioAccepted, setAudioAccepted ] = useState(false);

	const { loading, setLoading, setUser, setAccessToken, LCID, setLCID, sleep, getPathLength } = useContext(AppContext);
	
	useEffect(() => {
		//could add these to state variable  at start...
		let paths = document.querySelectorAll('svg .init-svg-path');
		console.log(paths);
		
		anime.set(paths, {
			strokeDasharray: getPathLength
		});
		
		anime({
			targets: paths,
			strokeDashoffset: [getPathLength, 0],
			easing: 'linear',
			duration: 250,
			delay: 250
		});
		
	},[])
	
	const handleAcceptAudio = () => {
		console.log('audio accepted...');
		setAudioAccepted(true);
	}
	
	useEffect(() => {
		if(audioAccepted === true) {
			//could add these to state variable  at start...
			let paths = document.querySelectorAll('svg .init-svg-path');
			anime({
				targets: paths,
				strokeDashoffset: [0, getPathLength],
				easing: 'linear',
				duration: 250,
				complete: async function() {
					//this is in the retract init auio border we wait 500 ms for the opacity 
					//and auth request animation to get done.... 
					//in total this should start after 750ms
					await sleep(500);
					setSequence((set) => ({...sequence, load_auth_req_content: true }));
				}				
			});
			
			//play init sound later....
		}
	},[audioAccepted]);
	
	useEffect(() => {
		if(initFinished) {
			
		}
	},[initFinished])
	
	useEffect(() => {
		if(sequence.load_auth_req_content) {
			console.log('Ready to request Refresh Access Token...');
			
			let LCID = localStorage.getItem('LCID');
			if(LCID) {
				setLCID(LCID);
				console.log('Found LCID in Local Storage...');
				
				let payload = {
					LCID: LCID,
					grant_type: 'refresh_token'
				}
				let options = {
					headers: {
						"Content-Type": "application/json"
					},
					withCredentials: true //so refresh cookie get transimitted....
				}
				axios.post('https://caos.pr0con.com:1400/api/auth/refresh_token', payload, options).then((res) => {
					console.log(res);
					switch(res.data.success) {
						case true:
							if ('user' in res.data && 'access_token' in res.data) {
								setUser(res.data.user);
								setAccessToken(res.data.access_token);
								setSequence((set) => ({...sequence, refresh_tokens_success: true }));
								break;
							}
							setSequence((set) => ({...sequence, refresh_tokens_success: false }));
							break;
						case false:
							if('success' in res.data && 'code' in res.data && res.data.success === false) {
								
								switch(res.data.code) {
									case "missing-refresh-token":
									case "missing-or-invalid-lcid":
										localStorage.removeItem('LCID');
										break;
									default:
										break;
								}
							}
							setSequence((set) => ({...sequence, refresh_tokens_success: false }));
							break;
					}
				}, (error) => {
					console.log(error);
				});
			}else {
				setLoading(false);
			}
		}
	},[sequence.load_auth_req_content]);
	
	const handleFinishInit = async () => {
		setInitFinished(true);
		await sleep(500);
		setLoading(false);
	}
	
	return(
		<StyledInit className={loading ? '' : 'load-complete'}>
			<div id="init-sound" className={audioAccepted ? 'true' : 'false'}>
				<svg id="initialize-sound-svg" viewBox="0 0 100 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
					<path className="init-svg-path" d="M0,10 L0,0 L10,0" ></path>
					<path className="init-svg-path" d="M90,0 L100,0 L100,10" ></path>
					<path className="init-svg-path" d="M10,40 L0,40 L0,30" ></path>
					<path className="init-svg-path" d="M100,30 L100,40 L90,40"></path>
				</svg>	
				<Type classes="" text="This site uses sound." sound={false} opacity=".6" revert={audioAccepted}/>			
				<UndecoratedButton text="Okay" revert={audioAccepted} clickFunc={(e) => handleAcceptAudio()} margin="2rem 0 0 0"/>
			</div>
			<div id="init-auth" className={audioAccepted ? 'true' : 'false'}>
				<div id="init-auth-border"></div>
				<div id="init-auth-content">
					{ sequence.load_auth_req_content &&  <Type classes="" text="Refresh Access Token (via Refresh Token Endpoint)" sound={false} opacity=".6" /> }  
					{ (sequence.refresh_tokens_success !== null && sequence.refresh_tokens_success === false) && 
						<Type classes="" text="Unable to refresh session (Please Login)" sound={false} opacity=".6" />
					}
					{ (sequence.refresh_tokens_success !== null && sequence.refresh_tokens_success === true) && 
						<Type classes="" text="User session refreshed!" sound={false} opacity=".6" />
					} 
					{ (sequence.refresh_tokens_success !== null && (sequence.refresh_tokens_success === true || sequence.refresh_tokens_success === false)) && 
						<UndecoratedButton id="init-auth-done-btn" text="Okay" revert={initFinished} clickFunc={(e) => handleFinishInit()} margin="2rem auto"/>
					}
				</div>
				<div id="init-auth-border"></div>
			</div>
		</StyledInit>	
	)
}