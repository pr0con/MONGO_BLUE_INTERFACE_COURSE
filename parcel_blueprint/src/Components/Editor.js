import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';

import SimpleEditor from 'react-simple-code-editor';
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/nightOwl";

const Pre = styled.pre`
	text-align: left;
	margin: 1em 0;
	padding: 0.5em;
	overflow: scroll;
	
	& .token-line {
		line-height: 1.3em;
		height: 1.3em;
	}
`;
export const Line = styled.div`
	display: table-row;
`;
export const LineNo = styled.span`
	display: table-cell;
	text-align: right;
	padding-right: 1em;
	user-select: none;
	opacity: 0.5;
`;
const LineContent = styled.span`
	display: table-cell;
`;


const StyledEditor = styled.div`
	position: relative;
	padding: 1rem;
	
	font-family: 'Roboto', sans-serif;
	font-size: 1.4rem;
`;

const highlight = code => (
    <Highlight {...defaultProps} theme={theme} code={code} language="jsx">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => <span {...getTokenProps({ token, key })} />)}
            </div>
          ))}
        </>
      )}
    </Highlight>
)
export function Editor({ code, setCode }) {
	const onValueChange = code => {
    	setCode(code);
	}	
	
	return(
		<StyledEditor>
			<SimpleEditor
		        value={code}
		        onValueChange={onValueChange}
		        highlight={highlight}
		        padding={10}
			/>
		</StyledEditor>
	)
}