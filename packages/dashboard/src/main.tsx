/**
 * @vizzo/dashboard — Main Entry
 * Imports all global and component CSS files, renders App into #root.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ─── Global Styles ──────────────────────────────────────────────
import './styles/tokens.css';
import './styles/reset.css';

// ─── Component Styles ───────────────────────────────────────────
import './styles/auth.css';
import './styles/onboarding.css';
import './styles/layout.css';
import './styles/analytics.css';
import './styles/productlist.css';
import './styles/productcard.css';
import './styles/productactions.css';
import './styles/productform.css';
import './styles/discount.css';
import './styles/editor.css';
import './styles/bannerslot.css';
import './styles/settings.css';
import './styles/billing.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
