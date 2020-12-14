import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

//import { AppContext } from './AppProvider.js';
import { CellContext } from './CellProvider.js';

const StyledHaloCell = styled.div`
	background: hsla(199, 100%, 29%, .2);
	border: 1px solid #000;
	width: calc(100% - 1rem);
	height: calc(100% - 1rem);
	margin-top: .5rem;
	margin-left: .5rem;
`;

export function HaloCell({index}) {
	const [ cellComponents, setCellComponents ] = useState([]);
	const { returnCellComponents, updateCell, updateToggle } = useContext(CellContext);
	
	const updateComponents = () => {
		let cell_components = returnCellComponents(index);
		setCellComponents([ ...cell_components]);
	}
	
	useEffect(() => {
		if(updateCell !== null && updateCell === index) {
			console.log(`Update cell components for window ${index}`);
			updateComponents();
		}
	},[updateCell, updateToggle]);
	
	
	/* on load only */
	useEffect(() => {
		console.log(`Rendering onload update cell ${index}`);
		updateComponents();
	},[]);
	
	return(
		<StyledHaloCell>
			{ cellComponents.length > 0 && cellComponents.map((com, i) =>{ if(com !== null) return (
				<span className="cell-com-wrapper" key={i}>{com}</span>
			)})}
		</StyledHaloCell>
	)
}


