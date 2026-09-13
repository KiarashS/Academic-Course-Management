import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { DataProvider } from './store/DataProvider'
import { PreferencesProvider } from './store/PreferencesProvider'
import { ToastProvider } from './store/ToastProvider'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <DataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DataProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)
