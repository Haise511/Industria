import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter — works without server-side rewrites, ideal for static
        Mini App hosts (Vercel/Netlify/Cloudflare Pages) and Telegram. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
