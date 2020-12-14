import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import { AppContext } from './AppProvider.js';

const StyledCellSelector = styled.div`
	position: absolute;
	
	bottom: 2rem;
	left: 50%;
	
	transform: translateX(-50%);
	
	display: flex;
`;

import { Button } from './Button.js';

export function CellSelector() {
	const { setHaloIndex, LogOut } = useContext(AppContext);
	
	const handleCellSelection = (cell) => {
		console.log(`Selecting Cell: ${cell}`);
		
		switch(cell) {
			case 'home':
				setHaloIndex(0);
				break;
			case 'node':
				setHaloIndex(4);
				break;
			case 'go':
				setHaloIndex(3);
				break;
			case 'python':
				setHaloIndex(2);
				break;				
			case 'php':
				setHaloIndex(1);
				break;
			case 'logout':
				LogOut();
				break;
			default:
				break;
		}
	}
	
	return(
		<StyledCellSelector>
			<Button btnText="Home" clickFunc={() => handleCellSelection('home')}/>
			<Button btnText="NodeJs" clickFunc={() => handleCellSelection('node')}/>
			<Button btnText="GoLang" clickFunc={() => handleCellSelection('go')}/>
			<Button btnText="Python" clickFunc={() => handleCellSelection('python')}/>
			<Button btnText="PHP" clickFunc={() => handleCellSelection('php')}/>
			<Button btnText="Log Out" clickFunc={() => handleCellSelection('logout')}/>
		</StyledCellSelector>	
	)
}