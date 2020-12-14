import React, {useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { AppContext } from './AppProvider.js';
import { CellContext } from './CellProvider.js';

import { Login } from './Login.js';
import { Websocket } from './Websocket.js';

import { PHPContext } from './PHPProvider.js';
import { PythonContext } from './PythonProvider.js';
import { GoContext } from './GoProvider.js';

const StyledContextHub = styled.div`

`;

export function ContextHub() {
	
	const { wsId, AccessToken, bypassToken } = useContext(AppContext);
	const { one, setOne, two, setTwo, three, setThree, four, setFour, five, setFive, setUpdateCell, updateToggle, setUpdateToggle } = useContext(CellContext);
	
	const { setPHPWsId, setPHPBypassToken } = useContext(PHPContext);
	const { setPythonWsId, setPythonBypassToken } = useContext(PythonContext);
	const { setGoWsId, setGoBypassToken } = useContext(GoContext);
	
	useEffect(() => {
		if(typeof AccessToken !== "undefined") {
			if(AccessToken !== null) {
				setOne([<Websocket />]);
				setUpdateCell(1);
				setUpdateToggle(!updateToggle);
			}
			if(AccessToken === null) {
				setOne([<Login />]);
				setUpdateCell(1);
				setUpdateToggle(!updateToggle);
			} 
		}
	},[AccessToken]);
	
	useEffect(() => {
		setPHPWsId(wsId);
		setPHPBypassToken(bypassToken);
		setPythonWsId(wsId);
		setPythonBypassToken(bypassToken);
		setGoWsId(wsId);
		setGoBypassToken(bypassToken);
	},[bypassToken]);
	
	return(
		<StyledContextHub></StyledContextHub>
	)
}