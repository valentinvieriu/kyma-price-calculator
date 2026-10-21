import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import { getDefaultStore } from 'jotai';
import App from './App';
import { syncConfigWithUrl } from './state/urlSync';

// Restore a shared estimate before the first render, then keep the URL current.
syncConfigWithUrl(getDefaultStore());

type RootElement = Element | DocumentFragment;

const root = ReactDOM.createRoot(
  document.getElementById('root') as RootElement,
);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
