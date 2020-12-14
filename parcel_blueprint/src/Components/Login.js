import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import anime from 'animejs';
import ReactJson from 'react-json-view';
import axios from 'axios';

// rem to px ,, 35 * 10 == 350px. px to rem 350 / 10 === 35rem
import { AppContext } from './AppProvider.js';
const StyledLogin = styled.div`
	position: absolute;
	
	width: 35rem;
	height: 50rem;
	
	top: 50%;
	left: 50%;
	
	transform: translate(-50%,-50%);
	
	
	color: #26dafd;
	
	svg#login-box-outer {
		width: 100%;
		height: 100%;
		
		path {
			fill: transparent;	
		}	
		
		.lb-p1,
		.lb-p2,
		.lb-p3,
		.lb-p4 { 
			stroke-dasharray: 85.8333px; stroke-dashoffset: 0px; 
		}
	}
	
	#login-box-inner {
		position: absolute;	
		top: 0px;
		left: 0px;
		
		width: 35rem;
		height: 0rem;
		
		transition: height .2s, opacity .2s;
		transition-delay: .1s;
		
		opacity: 0;
		background: rgba(0,0,0,.5);
		
		display: flex;
		flex-direction: column;
		
		#login-title {
			position: relative;
			min-height: 4rem;
			font-size: 2rem;
			margin-top: 1px;
			
			#login-title-inner {
				position: absolute;
				background: #006694;	
				min-height: 4rem;
				color: #fff;
				width: 0%;
				display: flex;
				align-items: center;
				justify-content: center;
				left: 50%;
				transform: translateX(-50%);
				overflow: hidden;		
			}		
		}
		#login-content-wrapper {
			position: relative;
			display: flex;
			flex-direction: column;
			padding: 2rem;
			flex-grow: 1;
			
			input {
				background: #000;
				border: 1px solid #30D6D6;
				height: 3rem;
				color: #fff;
				font-size: 2rem;
				font-style: italic;
				text-indent: 1rem;				
			}
			
			#login-response-data { 
				flex-grow: 1;
			}
		}
	}
	
	&.false {
		svg#login-box-outer {
			path {
				stroke: rgba(187,187,187,0.5);
				stroke-width: 1;	
			}
		}
		
		#login-box-inner {
			height: 50rem;
			opacity: 1;	
		}	
	}	
`;

import { Button } from './Button.js';

//Functional Component
export function Login() {
	const [ username, setUsername ] = useState('');
	const [ password, setPassword ] = useState('');
	const [ resData, setResData ] = useState(null); 
	
	const { setUser, setLCID, setAccessToken, loading, getPathLength  } = useContext(AppContext);
	
	useEffect(() => {
		if(loading === false) {
			let paths = document.querySelectorAll('svg#login-box-outer path');
			
			anime.set(paths, {
				strokeDasharray: getPathLength
			});
			
			anime({
				targets: paths,
				strokeDashoffset: [getPathLength, 0],
				easing: 'linear',
				duration: 1000
			});
			
			
			let t1 = anime.timeline({
				duration: 500
			});
			
			t1.add({
				targets: '#login-title-inner',
				width: 'calc(100% - 2px)',
				easing: 'easeInOutSine'
			})
			
		}
	},[loading]);
	
	const handleSubmit = () => {
		setResData({status: 'Awating response....'});
		
		let payload = {
			username: btoa(username),
			password: btoa(password)
		}
		
		let options = {
			headers: {
				'Content-Type': 'application/json'
			},
			withCredentials: true
		}
		axios.post('https://caos.pr0con.com:1400/api/auth/login', payload, options).then((res) => {
			setUser(res.data.user);
			setLCID(res.data.lcid);
			setAccessToken(res.data.access_token);
			localStorage.setItem('LCID', res.data.lcid);
			
			delete res.data.lcid;
			delete res.data.access_token;
			
			setResData(res.data);
			
		},(error) => {
			('data' in error.response) ? setResData(error.response.data) : console.log(error);
		});
	}
	
	return(
		<StyledLogin className={loading ? 'true' : 'false'}>
			<svg id="login-box-outer" viewBox="0 0 100 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
				<path className="lb-p1" d="M0,10 L0,0 L10,0"></path>
				<path className="lb-p2" d="M90,0 L100,0 L100,10"></path>
				<path className="lb-p3" d="M10,40 L0,40 L0,30"></path>
				<path className="lb-p4" d="M100,30 L100,40 L90,40"></path>
			</svg>
			<div id="login-box-inner">
				<div id="login-title">
					<div id="login-title-inner">
						<span id="login-title-inner-text">Login</span>
					</div>
				</div>
				<div id="login-content-wrapper">
					<input type="text" value={username} onChange={(e) => setUsername(e.target.value)}/>
					<input type="password" className="mt-10" value={password} onChange={(e) => setPassword(e.target.value)}/>
					<div id="login-response-data">
						{ resData !== null && <ReactJson src={resData} collapsed={false} theme="grayscale"/>}
					</div>
					<div id="login-actions">
						<Button btnText="Login" clickFunc={handleSubmit} />
					</div>
				</div>
			</div> 
		</StyledLogin>
	)
}