import React, { useState, useEffect, createContext } from 'react';


import { Login } from './Login.js';

import { Go } from './Go.js';
import { Node } from './Node.js';
import { Python } from './Python.js';
import { PHP } from './PHP.js';



export const CellContext = createContext();
export default function(props) {
	const [ one, setOne ] = useState([<Login />]);
	const [ two, setTwo ] = useState([<PHP />]);
	const [ three, setThree ] = useState([<Python />]);
	const [ four, setFour ] = useState([ <Go />]);
	const [ five, setFive ] = useState([<Node />]);
	
	const [ updateCell, setUpdateCell ] = useState(null);
	const [ updateToggle, setUpdateToggle ] = useState(true);
	
	const returnCellComponents = (index) => {
		switch(index) {
			case 1:
				return one;
				break;
			case 2:
				return two;
				break;
			case 3:
				return three;
				break;
			case 4:
				return four;
				break;
			case 5:
				return five;
				break;
		}
	}
	
	return(
		<CellContext.Provider value={{
			one,
			setOne,
			
			two,
			setTwo,
			
			three,
			setThree,
			
			four,
			setFour,
			
			five,
			setFive,
			
			updateCell, 
			setUpdateCell,
			
			updateToggle, 
			setUpdateToggle,
			
			returnCellComponents,
		}}>
			{ props.children }
		</CellContext.Provider>
	)
}