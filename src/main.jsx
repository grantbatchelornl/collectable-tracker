import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// GitHub Pages serves 404.html for direct requests to SPA routes such as
// /register or /collectible/:id. 404.html sends the browser through "/" and
// stores the original URL. Restore that URL before React Router initializes.
const redirectUrl = sessionStorage.getItem('github-pages-redirect')

if (redirectUrl) {
  sessionStorage.removeItem('github-pages-redirect')

  try {
    const target = new URL(redirectUrl)

    if (target.origin === window.location.origin) {
      const targetPath = `${target.pathname}${target.search}${target.hash}`
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

      if (targetPath !== currentPath) {
        window.history.replaceState(null, '', targetPath)
      }
    }
  } catch {
    // Ignore malformed stored URLs and continue loading the app normally.
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
