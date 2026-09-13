import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ContentErrorScreen } from './pages/ContentErrorScreen'
import { contentError } from './content/loadContent'
import { PreferencesProvider } from './store/PreferencesProvider'
import { ToastProvider } from './store/ToastProvider'
import './styles/index.css'

const root = createRoot(document.getElementById('root')!)

// The whole site is built from content/courses.yaml; if that cannot be read
// there is nothing to render but the reason why.
root.render(
  <StrictMode>
    {contentError ? (
      <ContentErrorScreen error={contentError} />
    ) : (
      /* basename keeps deep links working under a GitHub Pages project path */
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PreferencesProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </PreferencesProvider>
      </BrowserRouter>
    )}
  </StrictMode>,
)
