import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import ReactJson from 'react-json-view';

import { AppContext } from './AppProvider.js';
const StyledState = styled.div`
	position: absolute;
	
	top: 0px;
	left: 0px;
	
	background: #fff;
	
	width: 0px;
	height: 0px;
	
	overflow: hidden;
	
	&.true {
		width: 100vw;
		height: 100vh;
		overflow: scroll;
	}
	
	z-index: 12;
`;

export function State() {
	const app_data = useContext(AppContext);
	const { state } = useContext(AppContext);
	
	return(
		<StyledState className={state ? 'true' : 'false'}>
			<ReactJson src={app_data} collapsed={false} />
		</StyledState>
	)
}