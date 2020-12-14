import styled, { createGlobalStyle } from 'styled-components';

export const GS = createGlobalStyle`
	.ml-1 { margin-left: 1rem; }
	
	.mt-10 {
		margin-top: 1rem;	
	}

	.flex-filler { flex-grow: 1; }
	
	
	.input-with-icon {
		display: flex;
		max-height: 2rem;
		background: #000;
		border: 1px solid #30d6d6;
		align-items: center;
		padding: .2rem;
		
		svg { height: 1.4rem; }
		input {
			height: 1.4rem;
			border: 0px;
			background: transparent;
			color: #fff;
			text-indent: 1rem;	
		}	
	}
	
	.button-with-icon {
		display: flex;
		max-height: 2rem;
		align-items: center;
		padding: .2rem;
		background: #000;
		border: 1px solid #30d6d6;
		svg { height: 1.4rem; }
		
		span { margin-left: 1rem; color: #fff; text-transform: uppercase; }
		span.on-indicator {
			width: 1.1rem;
			height: 1.1rem;
			background: #0f0;
			border-radius: 50%;
			margin-top: -.2rem;	
		}
		span.off-indicator {
			width: 1.1rem;
			height: 1.1rem;
			background: #f00;
			border-radius: 50%;
			margin-top: -.2rem;	
		}
		
		&:hover { cursor: pointer; }				
	}
	
	.database-connector {
		position: relative;
		display: flex;
		flex-direction: column;
		color: #acf9fb;
		font-weight: bold;
		
		.database-connector-title {
			position: relative;
			height: 1.6rem;
			display: flex;
			
			.dct-center { text-align: center; }	
		}
		
		.database-connector-content {
			position: relative;
			flex-grow: 1;
			
			display: flex;
			max-height: calc(100% - 3.6rem);
			
			.dcc-left {
				position: relative;
				width: 32rem;
				max-height: calc(100% - 4rem);
				display: flex;
				flex-direction: column;
				
				.database-list {
					display: flex;
					flex-direction: column;
					margin-top: 1rem;
					.database {
						display: flex;
						justify-content: space-between;
						&:hover { cursor: pointer; background: rgba(0,0,0,.5); }
						
						.db-name { min-width: 10rem; max-width: 10rem; }
						
						&.selected {
							background: rgba(172,249, 251, .2);
						}
					}	
				}
				.collection-list {
					position: relative;
					display: flex;
					flex-direction: column;
					margin-top: 1rem;
					.collection {
						width: 100%;
						&:hover { 	cursor: pointer; background: rgba(0,0,0,.5); }
						&.selected { background: rgba(172,249, 251, .2); }
					}	
				}	
			}
			.dcc-right {
				position: relative;
				flex-grow: 1;
				display: flex;
				flex-direction: column;
				max-height: 100%;
				padding-left: 1rem;
				
				
				.document-editor {
					position: relative;
					min-height: 50%;
					max-height: 50%;
					padding-top: 1rem;
					
					display: flex;
					.react-json-view {
						width: 50%;
					}
				}
				.document-list {
					position: relative;
					min-height: calc(50% - .2rem);
					max-height: calc(50% - .2rem);
					display: flex;
					flex-direction: column;
					overflow: scroll;
					
					.document {
						&:hover { cursor: pointer; background: rgba(0,0,0,.5); }
						&.selected { background: rgba(172,249, 251, .2); }	
					}
				}
			}	
		}
		
		.database-connector-ops	 {
			position: relative;
			height: 2rem;
			display: flex;
			align-items: center;	
		}
		
		.editor-wrapper {
			position: absolute;
			top: 0px;
			right: 0px;
			
			width: 0px;
			overlfow: hidden;
			
			transition: width: .2s;
			
			&.true {
				width: calc(100% - 32rem);
				height: calc(100% - 2rem);	
			}	
		}
	}
`;





