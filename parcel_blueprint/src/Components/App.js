import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

import AppProvider from './AppProvider.js';
import { AppContext } from './AppProvider.js';

import SoundProvider from './SoundProvider.js';
import { SoundContext } from './SoundProvider.js';

import GoProvider from './GoProvider.js';
import { GoContext } from './GoProvider.js';

import PythonProvider from './PythonProvider.js';
import { PythonContext } from './PythonProvider.js';

import PHPProvider from './PHPProvider.js';
import { PHPContext } from './PHPProvider.js';

import CellProvider from './CellProvider.js'; 
import { CellContext } from './CellProvider.js';

const StyledApp = styled.div`
	position: relative;
	
	top:0px;
	left: 0px;
	
	width: 100vw;
	height: 100vh;
	
	font-size: 1.2rem;
	
	#halo-scene {
		position: relative;
		
		top:0px;
		left: 0px;
		
		width: 100vw;
		height: 100vh;
		
		perspective: 1000px;
	}
	
	overflow: hidden;
	background: #05070d;
`;

import { GS } from './GS.js';

const HaloWheel = styled.div`
	position: relative;
	
	top: 0px;
	left: 0px;
	
	width: 100vw;
	height: 100vh;
	
	transform: ${props => props.HaloZoomCss} ${props => props.HaloAngleCss};
	transform-style: preserve-3d;
	transition: transform 1s;
	
	.styled-halo-cell-wrapper  {
		position: absolute;
		width: 100vw;
		height: 100vh;
		
		top: 0px;
		left: 0px;
		
		transition: transform 1s, opacity 1s;
		
		&.window-1-1,
		&.window-2-2,
		&.window-3-3,
		&.window-4-4,
		&.window-5-5 {
			border: 1px solid #30D6D6;
		}
	}
`;

const HaloCellWrapper = styled.div`
	transform: ${props => props.transform};
`;

import { Init } from './Init.js';
import { State } from './State.js';
import { HaloCell } from './HaloCell.js';
import { CellSelector } from './CellSelector.js';
import { ContextHub } from './ContextHub.js';

function App() {
	return(
		<SoundProvider>
			<SoundContext.Consumer>
				{({ start }) => (
		
					<AppProvider start={start}>
						<AppContext.Consumer>
							{({ HaloCount, HaloCells, microIndex, setHaloIndex,  HaloZoomCss, HaloAngleCss }) => (
			
								<GoProvider>
									<GoContext.Consumer>
										{({  }) => (
											
											<PythonProvider>
												<PythonContext.Consumer>
													{({  }) => (
																	
														<PHPProvider>
															<PHPContext.Consumer>
																{({  }) => (																			
																																
																	<CellProvider>
																		<CellContext.Consumer>
																			{({  }) => (													
																
																				<StyledApp>
																					<GS />
																					<Init />
																					<div id="halo-scene">
																						<HaloWheel HaloZoomCss={HaloZoomCss} HaloAngleCss={HaloAngleCss}>
																							{ HaloCount > 0 && HaloCells.map((hs,index) => (
																								<HaloCellWrapper key={index} transform={HaloCells[index]} className={`styled-halo-cell-wrapper window-${index+1}-${microIndex}`}>
																									<HaloCell index={index+1} />
																								</HaloCellWrapper>
																							))}						
																						</HaloWheel>
																					</div>
																					
																					<State />
																					<ContextHub />
																					<CellSelector />
																				</StyledApp>
																																							
																			)}
																		</CellContext.Consumer>
																	</CellProvider>																	
			
																)}
															</PHPContext.Consumer>
														</PHPProvider>
			
													)}
												</PythonContext.Consumer>
											</PythonProvider>
														
										)}
									</GoContext.Consumer>
								</GoProvider>
													
							)}
						</AppContext.Consumer>
					</AppProvider>
	
				)}
			</SoundContext.Consumer>
		</SoundProvider>
	)
}

if(document.querySelector('#react_root')) {
	ReactDOM.render(<App />, document.querySelector('#react_root'));
}