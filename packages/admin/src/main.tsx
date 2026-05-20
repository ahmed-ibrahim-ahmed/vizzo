/**
 * @vizzo/admin — Main Client Entry Point
 * Boots React 19 application in StrictMode rendering into index.html mount point.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element to mount vizzo-admin App.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
