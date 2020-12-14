import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { SoundContext } from './SoundProvider.js';

const StyledType = styled.div`
	font-size: ${(props) => props.fontSize};
	color: 	${(props) => props.color};	
	opacity: ${(props) => props.opacity};
`;

export function Type({ classes, text, sound = true, fontSize="1.2rem", onComplete = false, revert=false, color="#ccc", opacity="1" }) {
	const { typing } = useContext(SoundContext);
	
	const [ i, setI ] = useState(0);
	const [ typed, setTyped ] = useState('');
	const [ split, setSplit ] = useState([]);
	
	const [ last, setLast ] = useState('');
	const [ newData, setNewData ] = useState(false);
	
	const [ revertDone, setRevertDone ] = useState(true);
	
	//move to app context later
	const sleep = (milliseconds) => {
		return new Promise(resolve => setTimeout(resolve, milliseconds))
	}
	
	useEffect(() => {
		if(last !== '' && text !== last) {
			console.log('got new text data');
			setNewData(true);
		}
		setLast(text);
	},[text]);
	
	useEffect(() => {
		if(revertDone) {
			if(text.length > 0 && revert === false) {
				//step one split incoming text into array
				if(split.length === 0) { setSplit(text.split("")); }
				//next step add array characters one by one to typed array
				if(split.length > 0 && i < text.length) {
					sleep(5).then(() => {
						setTyped(typed.concat(split[i]));
						setI(i+1);
					});
				}
				
				if(i === (text.length -1)) {
					setRevertDone(false);
				}
				
			}
		}
	},[text, split,i, revertDone]);
	
	useEffect(() => {
		if(revert === true || newData === true) {
			sleep(5).then(() => {
				let ns = typed.substring(0, typed.length - 1);
				setTyped(ns);
			});
			if(typed.length === 0) {
				console.log('Finished Reverting Text...');
				setI(0);
				setSplit([]);
				setNewData(false);
				setRevertDone(true);
			}
		}
	},[revert,typed,newData]);
	
	useEffect(() => {
		if(sound && text !== last) {
			sleep(200).then(() => {
				if(text.length > 0) {
					typing.play();
				}
			});
		}
	},[text]);
	
	return(
		<StyledType className={classes} fontSize={fontSize} color={color} opacity={opacity}>
			{typed}
		</StyledType>
	)
}