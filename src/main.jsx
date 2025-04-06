import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
//import './assets/styles/main.css';
//import './assets/styles/codeEditor.css';

// Initialize the root element for React
const rootElement = document.getElementById('root');

// If root element exists, render React app
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Export these for use in other parts of the app (like CodeEditorBridge)
window.React = React;
window.ReactDOM = ReactDOM;

// For debugging
console.log('main.jsx loaded, React version:', React.version);