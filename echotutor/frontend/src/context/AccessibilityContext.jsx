import { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

const STORAGE_KEY = 'echo_accessibility'

const defaults = {
  highContrast:  false,
  largeText:     false,
  dyslexiaFont:  false,
  voiceOnly:     false,
  reduceMotion:  false,
}

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
    } catch {
      return defaults
    }
  })

  // Apply CSS classes to <html> element whenever settings change
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('high-contrast',  settings.highContrast)
    html.classList.toggle('text-large',     settings.largeText)
    html.classList.toggle('dyslexia-mode',  settings.dyslexiaFont)
    html.classList.toggle('reduce-motion',  settings.reduceMotion)

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const apply = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const reset = () => setSettings(defaults)

  return (
    <AccessibilityContext.Provider value={{ settings, toggle, apply, reset }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}
