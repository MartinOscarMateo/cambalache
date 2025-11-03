import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './lib/leafletIcons.js'
import './index.css'
import './styles/base/typography.css';
import './styles/base/links.css';
import './styles/utilities/buttons.css';
import './styles/utilities/layout.css';
import './styles/utilities/buttons.css';
import './styles/utilities/helpers.css';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
