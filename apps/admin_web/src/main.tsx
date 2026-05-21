import React from 'react'
import ReactDOM from 'react-dom/client'
import './lib/i18n' // Initialize i18n before App
import App from './app/App'
import { registerServiceWorker } from './lib/sw-register'
import './index.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import { QueryProvider } from './app/QueryProvider' // Import QueryProvider

ReactDOM.createRoot(document.getElementById('app-root')!).render(
  <React.StrictMode>
    <QueryProvider> {/* Wrap App with QueryProvider */}
      <App />
    </QueryProvider>
  </React.StrictMode>,
)

registerServiceWorker()
