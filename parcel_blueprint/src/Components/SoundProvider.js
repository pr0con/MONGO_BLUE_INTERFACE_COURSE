import React, { createContext } from 'react';
//Checkout Howler.js
//https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide

export const SoundContext = createContext();
export default function({children}) {
	const start = new Audio('./sounds/start.mp3');
	const click = new Audio('./sounds/click.mp3');
	const typing = new Audio('./sounds/typing.mp3');

	return(
		<SoundContext.Provider value={{
			start,
			click,
			typing
		}}>
			{children}
		</SoundContext.Provider>
	)
}