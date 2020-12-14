import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import ReactJson from 'react-json-view';

import { difference } from './Utilz.js';
import { GoContext } from './GoProvider.js';

const StyledGo = styled.div`
	position: relative;
	
	top: 0px;
	left: 0px;
	
	width: 100%;
	height: calc(100% - 6rem);	
`;

const defaultCode = `
[{"key": "value"}]
`.trim()

import { Type } from './Type.js';
import { Editor } from './Editor.js';


export function Go() {
	const [ currentOp, setCurrentOp ] = useState('');
	const [ database, setDatabase ] = useState('');
	const [ collection, setCollection ] = useState('');
	const [ document, setDocument ] = useState('');
	
	const [ insertMany, setInsertMany ] = useState(false);
	const [ currentDocument, setCurrentDocument ] = useState({});
	const [ modifiedDocumentValues, setModifiedDocumentValues ] = useState(null);
	
	const [ newDb, setNewDb ] = useState('');
	const [ newCol, setNewCol ] = useState('');
	const [ newDoc, setNewDoc ] = useState({});
	
	const [ code, setCode ] = useState(defaultCode);
	
	const { rs, wsId, request, databases, collections, setCollections, documents, setDocuments, insertedDocument, setInsertedDocument } = useContext(GoContext);
	
	useEffect(() => {
		if(rs === 1) {
			setCurrentOp('Collecting Databases...');
			request('get-databases', null)
		}
	},[rs]);
	
	useEffect(() => {
		if(database !== '') {
			setCurrentOp(`Requesting ${database} Collections...`);
			setCollection('');
			setCurrentDocument({});
			setDocuments(null);
			
			request('get-collections', database);
		} 
	},[database]);	
	
	useEffect(() => {
		if(collection !== '') {
			setCurrentOp(`Requesting ${collection} Documents...`);
			request('get-documents', JSON.stringify({ db: database, col: collection }));
			
			setCurrentDocument({});
		}
	},[collection]);
		
	const dropDatabase = () => {
		if(database != '') {
			setCurrentOp(`Dropping ${database} database`);
			request('drop-database', database);
			
			setCollections(null);
			setDocuments(null);
		}
	}
	
	const createDatabase = (e) => {
		if(e.key === 'Enter') {
			setCurrentOp(`Creating new database ${newDb}`);
			request('create-database', newDb);
			setNewDb('');
		}
	}
	
	const dropCollection = () => {
		if(database !== '' && collection !== '') {
			setCurrentOp(`Dropping ${collection} in ${database}`);
			request('drop-collection', JSON.stringify({db: database, col: collection}));
				
			setCollection('');
			setDocuments(null);
		}
	}
	
	const createCollection = (e) => {
		if(e.key === 'Enter' && database !== '') {
			setCurrentOp(`Create new collection -> ${newCol} in -> ${database}`);
			request('create-collection', JSON.stringify({db: database, col: newCol}));
			setNewCol('');
		}
	}
	
	const updateModifiedDocument = (e) => {
		let diff = difference(currentDocument, e.existing_src);
		let diff2 = difference(e.existing_src, e.updated_src);
		
		let new_values = {
			...diff,
			...diff2
		}
		
		if(Object.keys(new_values).length > 0) {
			console.log(new_values);
			setModifiedDocumentValues(new_values);
		}
	}
	
	const updateNewDoc = (e) => {
		setNewDoc(e.updated_src);	
	}
	
	const saveModifiedDocument = () => {
		if(Object.keys(modifiedDocumentValues).length > 0) {
			if(database !== '' && collection !== '') {
				setCurrentOp(`Updating document ${currentDocument._id} in -> ${collection} in -> ${database}`);
				
				let set = {"$set": { ...modifiedDocumentValues }}
				request('update-document', JSON.stringify({db: database, col: collection, oid: currentDocument._id, values: JSON.stringify(set)  }));
			}
		}
	}
	
	const createDocument = () => {
		if(database !== '' && collection !== '') {
			if(!insertMany) {
				setCurrentOp(`Creating new document in -> ${collection} in -> ${database}`);
				request('insert-document', JSON.stringify({db: database, col: collection, doc: JSON.stringify(newDoc) }));
				setNewDoc({});
			}else if(insertMany) {
				setCurrentOp(`Attempting to Insert Many in -> ${collection} in -> ${database}`);
				request('insert-many', JSON.stringify({db: database, col: collection, data: JSON.stringify(code) }));
			}
		}
	}
	
	useEffect(() => {
		if(insertedDocument !== null && '_id' in insertedDocument) {
			setDocument(insertedDocument._id);
			setCurrentDocument(insertedDocument);
		}
	},[insertedDocument]);
			
		
	
	return(
		<StyledGo className="database-connector">
			<div className="database-connector-title">
				<span className="dct-left">Golang</span>
				<span className="dct-center flex-filler">wsId: {wsId} - Ready State ({rs})</span>
				<span className="dct-right"><Type text={currentOp} fontSize="1.1rem" color="#acf9fb"/></span>
			</div>
			<div className="database-connector-content">
				<div className="dcc-left">
					<div className="database-list">
						{	(databases !== null && databases.length > 0) && databases.map((db,i) => (
							<div className={`database ${database === db ? 'selected' : ''}`} onClick={(e) => setDatabase(db)} key={`go-db-${i}`}>
								<span className="db-name">{ db }</span>
								{   
									/* 
									   <span className="db-size">{ db.sizeOnDisk }</span>
									   <span className="db-empty">{ db.empty ? 'true' : 'false' }</span> 
									*/ 
								}
							</div>
						))}
					</div>
					
					<div className="collection-list">
						{ (collections !== null && collections.length > 0) && collections.map((c,i) => (
							<div className={`collection ${collection === c ? 'selected' : ''}`} onClick={(e) => setCollection(c)} key={`go-collection-${i}`}>
								{c}
							</div>
						))}
					</div>
				</div>
				<div className="dcc-right">
					<div className="document-editor">
						{ (collection !== null && collection !== '' && !insertMany) &&
							<ReactJson src={currentDocument} collapsed={false} theme="grayscale" collapseStringsAfterLengh={30}	enableEdit={true} enableDelete={true}
								onEdit={(e) => {
									console.log('Edit Callback', e);
									updateModifiedDocument(e);
								}}
								onDelete={(e) => {
									console.log('Delete Callback', e);
									updateModifiedDocument(e);
								}}
								onAdd={(e) => {
									console.log('Add Callback', e);
									if(e.new_value == "error") {
										return false;
									}
									updateModifiedDocument(e);
								}}
							/>						
						}
						{ (collection !== null && collection !== '' && !insertMany) &&
							<ReactJson src={newDoc} collapsed={false} theme="grayscale" collapseStringsAfterLengh={30}	enableEdit={true} enableDelete={true}
								onEdit={(e) => {
									console.log('Edit Callback', e);
									updateNewDoc(e);
								}}
								onDelete={(e) => {
									console.log('Delete Callback', e);
									updateNewDoc(e);
								}}
								onAdd={(e) => {
									console.log('Add Callback', e);
									if(e.new_value == "error") {
										return false;
									}
									updateNewDoc(e);
								}}
							/>							
						}					
					</div>
					<div className="document-list">
						{ (documents !== null && documents.length > 0 && !insertMany) && documents.map((d,i) => (
							<div className={`document ${document === d._id ? 'selected' : ''}`} onClick={(e) => {setDocument(d._id); setCurrentDocument(d);}} key={`go-document-${i}`}>
								{d._id}
							</div>
						))}
					</div>					
				</div>
			</div>	
			<div className="database-connector-ops">
				<div className="input-with-icon">
					<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="database" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M224 32c106 0 192 28.75 192 64v32c0 35.25-86 64-192 64S32 163.25 32 128V96c0-35.25 86-64 192-64m192 149.5V224c0 35.25-86 64-192 64S32 259.25 32 224v-42.5c41.25 29 116.75 42.5 192 42.5s150.749-13.5 192-42.5m0 96V320c0 35.25-86 64-192 64S32 355.25 32 320v-42.5c41.25 29 116.75 42.5 192 42.5s150.749-13.5 192-42.5m0 96V416c0 35.25-86 64-192 64S32 451.25 32 416v-42.5c41.25 29 116.75 42.5 192 42.5s150.749-13.5 192-42.5M224 0C145.858 0 0 18.801 0 96v320c0 77.338 146.096 96 224 96 78.142 0 224-18.801 224-96V96c0-77.338-146.096-96-224-96z"></path></svg>	
					<input type="text" placeholder="New Database" value={newDb} onChange={(e) => setNewDb(e.target.value)} onKeyUp={(e) => createDatabase(e)} />
				</div>
				<div className="input-with-icon ml-1">
					<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="album-collection" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M496 80a16 16 0 0 0-16-16H32a16 16 0 0 0-16 16v16h480zm-16-64a16 16 0 0 0-16-16H48a16 16 0 0 0-16 16v16h448zm0 112H32C13.19 128-1.57 145.62.13 166.07l26.18 314.18c1.5 18 15.32 31.75 31.87 31.75h395.64c16.55 0 30.37-13.77 31.86-31.75l26.19-314.18C513.57 145.62 498.82 128 480 128zm-26.21 349.6c-.12 1.47-.69 2.31-.2 2.4l-394.32.27a4 4 0 0 1-1.07-2.68L32 163.41c-.18-2.09.67-3.32.12-3.41h447a5 5 0 0 1 .82 3.41zM256 299.15c-14.55 0-26.25 10.16-26.13 22.6S241.69 344 256 344s26-9.9 26.14-22.23-11.58-22.62-26.14-22.62zM256 192c-92.9 0-164.33 61.88-159.79 134.4C100.51 395 172 448 256 448s155.5-53 159.8-121.6C420.33 253.88 348.9 192 256 192zm0 224c-67.34 0-124.7-41.09-127.86-91.6-1.69-27 11.71-47.29 23.25-59.58C175.77 238.88 213.9 224 256 224s80.23 14.88 104.6 40.82c11.54 12.29 24.95 32.6 23.26 59.58C380.7 374.91 323.34 416 256 416z"></path></svg>
					<input type="text" placeholder="New Collection" value={newCol} onChange={(e) => setNewCol(e.target.value)} onKeyUp={(e) => createCollection(e)} />
				</div>
				<div className="flex-filler"></div>
				<div className="button-with-icon" onClick={(e) => setInsertMany(!insertMany)}>
					<span className={`${insertMany ? 'on-indicator' : 'off-indicator'}`}></span>
					<span>Insert Many</span>
				</div>				
				<div className="button-with-icon ml-1" onClick={(e) => dropDatabase()}>
					<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="skull-crossbones" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M264 160c13.24 0 24-10.76 24-24s-10.76-24-24-24-24 10.76-24 24 10.76 24 24 24zm-80 0c13.24 0 24-10.76 24-24s-10.76-24-24-24-24 10.76-24 24 10.76 24 24 24zm-48.97 67.93l-6.41 30.24c-3.21 15.15 6.5 29.82 19.73 29.82h151.3c13.23 0 22.94-14.67 19.73-29.82l-6.41-30.24C346.25 204.49 368 168.67 368 128 368 57.31 303.53 0 224 0S80 57.31 80 128c0 40.67 21.75 76.49 55.03 99.93zM224 32c61.76 0 112 43.06 112 96 0 28.32-15.11 55.21-41.46 73.77l-17.25 12.15 4.37 20.64 4.54 21.43H161.79l4.54-21.43 4.37-20.64-17.25-12.15C127.11 183.21 112 156.32 112 128c0-52.94 50.24-96 112-96zm45.12 384l174.03-65.94c4.06-1.74 5.94-6.45 4.2-10.51l-6.31-14.71a7.996 7.996 0 0 0-10.5-4.2L224 398.91 17.47 320.65a7.996 7.996 0 0 0-10.5 4.2L.66 339.56c-1.74 4.06.14 8.77 4.2 10.51L178.88 416 4.85 481.94c-4.06 1.74-5.94 6.45-4.2 10.51l6.31 14.7a7.996 7.996 0 0 0 10.5 4.2L224 433.09l206.53 78.26a7.996 7.996 0 0 0 10.5-4.2l6.31-14.7c1.74-4.06-.14-8.77-4.2-10.51L269.12 416z"></path></svg>
					<span>Drop Database</span>
				</div>
				<div className="button-with-icon ml-1" onClick={(e) => dropCollection()}>
					<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="skull-crossbones" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M264 160c13.24 0 24-10.76 24-24s-10.76-24-24-24-24 10.76-24 24 10.76 24 24 24zm-80 0c13.24 0 24-10.76 24-24s-10.76-24-24-24-24 10.76-24 24 10.76 24 24 24zm-48.97 67.93l-6.41 30.24c-3.21 15.15 6.5 29.82 19.73 29.82h151.3c13.23 0 22.94-14.67 19.73-29.82l-6.41-30.24C346.25 204.49 368 168.67 368 128 368 57.31 303.53 0 224 0S80 57.31 80 128c0 40.67 21.75 76.49 55.03 99.93zM224 32c61.76 0 112 43.06 112 96 0 28.32-15.11 55.21-41.46 73.77l-17.25 12.15 4.37 20.64 4.54 21.43H161.79l4.54-21.43 4.37-20.64-17.25-12.15C127.11 183.21 112 156.32 112 128c0-52.94 50.24-96 112-96zm45.12 384l174.03-65.94c4.06-1.74 5.94-6.45 4.2-10.51l-6.31-14.71a7.996 7.996 0 0 0-10.5-4.2L224 398.91 17.47 320.65a7.996 7.996 0 0 0-10.5 4.2L.66 339.56c-1.74 4.06.14 8.77 4.2 10.51L178.88 416 4.85 481.94c-4.06 1.74-5.94 6.45-4.2 10.51l6.31 14.7a7.996 7.996 0 0 0 10.5 4.2L224 433.09l206.53 78.26a7.996 7.996 0 0 0 10.5-4.2l6.31-14.7c1.74-4.06-.14-8.77-4.2-10.51L269.12 416z"></path></svg>				
					<span>Drop Collection</span>
				</div>				
				<div className="button-with-icon ml-1" onClick={(e) => saveModifiedDocument()}>
					<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="file-export" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M567.31 283.89l-71.78-68.16c-8.28-7.8-20.41-9.88-30.84-5.38-10.31 4.42-16.69 13.98-16.69 24.97V288h-64V131.97c0-12.7-5.1-25-14.1-33.99L286.02 14.1c-9-9-21.2-14.1-33.89-14.1H47.99C21.5.1 0 21.6 0 48.09v415.92C0 490.5 21.5 512 47.99 512h288.02c26.49 0 47.99-21.5 47.99-47.99V352h-31.99v112.01c0 8.8-7.2 16-16 16H47.99c-8.8 0-16-7.2-16-16V48.09c0-8.8 7.2-16.09 16-16.09h176.04v104.07c0 13.3 10.7 23.93 24 23.93h103.98v128H168c-4.42 0-8 3.58-8 8v16c0 4.42 3.58 8 8 8h280v52.67c0 10.98 6.38 20.55 16.69 24.97 14.93 6.45 26.88-1.61 30.88-5.39l71.72-68.12c5.62-5.33 8.72-12.48 8.72-20.12s-3.1-14.81-8.7-20.12zM256.03 128.07V32.59c2.8.7 5.3 2.1 7.4 4.2l83.88 83.88c2.1 2.1 3.5 4.6 4.2 7.4h-95.48zM480 362.88V245.12L542 304l-62 58.88z"></path></svg>				
					<span>Save Changes</span>
				</div>
				<div className="button-with-icon ml-1" onClick={(e) => createDocument()}>
					<svg aria-hidden="true" focusable="false" data-prefix="fal" data-icon="file" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zm-22.6 22.7c2.1 2.1 3.5 4.6 4.2 7.4H256V32.5c2.8.7 5.3 2.1 7.4 4.2l83.9 83.9zM336 480H48c-8.8 0-16-7.2-16-16V48c0-8.8 7.2-16 16-16h176v104c0 13.3 10.7 24 24 24h104v304c0 8.8-7.2 16-16 16z"></path></svg>				
					<span>
						{ insertMany ? 'Insert Documents' : 'Create Document' }
					</span>
				</div>													
			</div>	
			<div className={`editor-wrapper ${insertMany ? 'true' : 'false'}`}>
				<Editor code={code} setCode={setCode} />
			</div>								
		</StyledGo>
	)

}
