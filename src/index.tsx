import React from 'react'
import ReactDOM from 'react-dom/client'

import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'


import { store } from './store/store'
import { RootCmp } from './RootCmp'

import './assets/styles/main.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error("Root element not found. Make sure the element with id 'root' exists in your HTML.");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
	<Provider store={store}>
		<Router basename="/Positarget--Frontend">
			<RootCmp />
		</Router>
	</Provider>
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
