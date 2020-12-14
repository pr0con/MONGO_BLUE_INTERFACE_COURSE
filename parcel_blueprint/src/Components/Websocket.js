import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';


import { AppContext } from './AppProvider.js';

const StyledWebsocket = styled.div`
	position: absolute;
	top: .5rem;
	right: 1rem;
	
	color: #fff;
	font-size: 1.4rem;
	
	text-align: right;
`;

import { Type } from './Type.js';

export function Websocket() {
	const { rs, wsId, CSRFToken } = useContext(AppContext);
	
		
	return(
		<StyledWebsocket>
			{ (rs !== null && rs !== 3) && <Type text={`Websocket Ready-State: ${rs}`} sound={true} fontSize="1.4rem" opacity=".6" /> }	
			{ wsId !== null  && <Type text={`Websocket Id: ${wsId}`} sound={true} fontSize="1.4rem" opacity=".6" /> }
			{ CSRFToken !== null  && <Type text={`Websocket CSRFToken: ${CSRFToken}`} sound={true} fontSize="1.4rem" opacity=".6" /> }
		</StyledWebsocket>
	)
}