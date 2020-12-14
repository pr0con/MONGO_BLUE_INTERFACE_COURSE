import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const StyledUndecoratedButton = styled.div`
	position: relative;
	width: 11.8rem;
	height: 3rem;
		
	color: #26dafd;	
	background-color: rgba(4,35,41,0);

	font-size: 1.4rem;
	text-transform: uppercase;
	
	.ubtn-border {
		position: absolute;
		width: 0px;
		height: 0px;
		
		&.border-top { top: 0px; left: 0px; }
		&.border-right { bottom: 0px; right: 0px; }
		&.border-bottom { bottom: 0px; left: 0px; }
		&.border-left { top: 0px; left: 0px; }
		
		border-color: rgba(39,225,250,.4);
		border-style: solid;
		
		transition: all 250ms;
		transition-delay: 250ms;
		
		border-width: 0px;
	}
	
	&.true {
		transition: all 250ms ease-out;
		transition-delay: 250ms;
		
		background-color: rgba(39,225,250, .1);
		
		.ubtn-border {
			&.border-top { border-width: 1px 0 0 0; width: 100%; }
			&.border-right { border-width: 0 1px  0 0; height: 100%; }
			&.border-bottom { border-width: 0 0 1px 0; width: 100%; }
			&.border-left { border-width: 0 0 0 1px; height: 100%; }			
		}	
	}
	
	text-align: center;
	line-height: 3rem;
	margin: ${(props) => props.margin};
	
	&:hover { cursor: pointer; }
`;

import { Type } from './Type.js';

export function UndecoratedButton({ id = "", text, clickFunc, revert, margin='0 0 0 0'}) {
	const [animate, setAnimate] = useState(false);
	
	
	
	useEffect(() => {
		console.log('revert: ', revert);
		(revert) ? setAnimate(false) : setAnimate(true);
	},[revert]);
	
	
	return(
		<StyledUndecoratedButton id={id} className={animate ? 'true' : 'false'} onClick={(e) => clickFunc()} margin={margin}>
			<div className="ubtn-border border-top"></div>
			<div className="ubtn-border border-right"></div>
			<div className="ubtn-border border-bottom"></div>
			<div className="ubtn-border border-left"></div>
			
			<Type text="Okay" sound={false} revert={revert} fontSize="1.4rem" color="#27e1fa" />
		</StyledUndecoratedButton>
	)
}