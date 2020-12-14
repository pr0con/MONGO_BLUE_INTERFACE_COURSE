import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { SoundContext } from './SoundProvider.js';

const StyledButton = styled.div`
	position: relative;
	width: 11.8rem;
	height: 3.5rem;
		
	color: #26dafd;	
	background-color: rgba(4,35,41,0.65);
	
	&:hover { cursor: pointer; }
	
	.btn-border {
		position: absolute;
		border-color: #029dbb;
		box-shadow: 0 0 4px rgba(2,157,187,0.65);
		border-style: solid;
		
		transition: all 250ms ease-in;
		
		&.tb {
			top: 0px;
			left: 50%;
			width: 100%;
			transform: translate(-50%,0);
			border-width: 1px 0 0 0;
		}
		&.rb {
			top: 50%;
			right: 0;
			height: 100%;
			transform: translate(0, -50%);
			border-width: 0 0 0 1px;	
		}
		
		&.bb {
			left: 50%;
			width: 100%;
			bottom: 0px;
			transform: translate(-50%,0);
			border-width: 0 0 1px 0;
		}
		&.lb {
			top: 50%;
			left: 0px;
			height: 100%;
			transform: translate(0, -50%);
			border-width: 0 0 0 1px;			
		}
	}
	
	.btn-corner {
		width: 8px;
		height: 8px;
		border-color: #acf9fb;
		box-shadow: 0 0 4px -2px rgba(172,249,251,0.65);
		
		z-index: 2;
		opacity: 1;
		position: absolute;
		transition: all 250ms ease-in;
		border-style: solid;
		
		&.tlc {
			left: -1px;
			top: -1px;
			border-width: 1px 0 0 1px;
		}
		&.trc {
			right: -1px;
			top: -1px;
			border-width: 1px 1px 0 0;
		}
		&.blc {
			left: -1px;
			bottom: -1px;
			border-width: 0 0 1px 1px;
		}
		&.brc {
			right: -1px;
			bottom: -1px;
			border-width: 0 1px 1px 0;
		}
	}
	
	.btn-text {
		position: absolute;
		
		top: 0px;
		left: 0px;
		
		width: 100%;
		height: 100%;

		display: flex;
		align-items: center;
		justify-content: center;			
	}
	
	.btn-background-fader {
		position: absolute;
		
		top: 0px;
		left: 0px;
		
		width: 100%;
		height: 100%;
		
		opacity: 0;
		background-color: rgba(172,249,251,1);
	}
	
	&.true {
		.btn-background-fader {
			animation: btn-clicked 250ms ease-out 0ms 1;
		}
	}
	
	@keyframes btn-clicked {
		0% {
			opacity: 1;	
		}
		100% {
			opacity: 0;	
		}	
	}
`;

export function Button({ btnText, clickFunc }) {
	const sleep = (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	}	
	
	const [ clicked, setClicked ] = useState(false);
	const { click } = useContext(SoundContext);
	
	const handleBtnClick = async () => {
		setClicked(true);
		
		await sleep(250);
		setClicked(false);
	}
	
	useEffect(() => {
		if(clicked === true) {		
			clickFunc();
			click.play();
		}
	},[clicked]);
	
	return(
		<StyledButton className={clicked ? 'true' : 'false'} onClick={(e) => handleBtnClick()}>
			<div className="btn-border tb"></div>
			<div className="btn-border rb"></div>
			<div className="btn-border bb"></div>
			<div className="btn-border lb"></div>
			
			<div className="btn-corner tlc"></div>
			<div className="btn-corner trc"></div>
			<div className="btn-corner blc"></div>
			<div className="btn-corner brc"></div>
			
			<div className="btn-text">{ btnText }</div>
			<div className="btn-background-fader"></div>
		</StyledButton>	
	)
}