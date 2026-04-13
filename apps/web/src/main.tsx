import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './core/router/app-router';
import { AppProviders } from './core/providers/app-providers';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
