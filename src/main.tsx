import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import SynthDepthTestApp from './app/SynthDepthTestApp'
import { isSynthDepthTestPath } from './utils/appPaths'
import './index.css'

const Root = () =>
  isSynthDepthTestPath() ? <SynthDepthTestApp /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
