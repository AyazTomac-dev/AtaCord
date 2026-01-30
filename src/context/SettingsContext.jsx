import React, { createContext, useContext, useState, useEffect } from 'react'
import { secureGetItem, secureSetItem } from '../utils/security'

// Define default settings
const defaultSettings = {
  // Appearance
  theme: 'dark', // 'dark', 'light', 'amoled'
  fontSize: 'normal', // 'small', 'normal', 'large'
  compactMode: false,
  
  // Audio/Video
  inputDevice: null,
  outputDevice: null,
  videoDevice: null,
  
  // Privacy
  allowDMs: 'friends', // 'everyone', 'friends'
  readReceipts: true,
  onlineStatus: true,
  
  // Blocked users
  blockedUsers: [],
  
  // User preferences
  language: 'tr'
}

// Create context
const SettingsContext = createContext()

// Provider component
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings()
  }, [])

  // Apply theme to document body
  useEffect(() => {
    if (isLoaded) {
      applyTheme(settings.theme)
      saveSettings()
    }
  }, [settings.theme, isLoaded])

  // Apply font size class to document
  useEffect(() => {
    if (isLoaded) {
      applyFontSize(settings.fontSize)
      saveSettings()
    }
  }, [settings.fontSize, isLoaded])

  // Apply compact mode class
  useEffect(() => {
    if (isLoaded) {
      applyCompactMode(settings.compactMode)
      saveSettings()
    }
  }, [settings.compactMode, isLoaded])

  const loadSettings = () => {
    try {
      const savedSettings = secureGetItem('atacord_settings')
      if (savedSettings) {
        setSettings(prev => ({
          ...defaultSettings,
          ...savedSettings
        }))
      }
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setIsLoaded(true)
    }
  }

  const saveSettings = () => {
    try {
      secureSetItem('atacord_settings', settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      return newSettings
    })
  }

  const updateMultipleSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  // Theme functions
  const setTheme = (theme) => {
    updateSetting('theme', theme)
  }

  const applyTheme = (theme) => {
    const body = document.body
    
    // Remove all theme classes
    body.classList.remove('theme-dark', 'theme-light', 'theme-amoled')
    
    // Add selected theme class
    body.classList.add(`theme-${theme}`)
    
    // Apply to document element as well for full coverage
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-amoled')
    document.documentElement.classList.add(`theme-${theme}`)
  }

  // Font size functions
  const setFontSize = (size) => {
    updateSetting('fontSize', size)
  }

  const applyFontSize = (size) => {
    const body = document.body
    body.classList.remove('text-small', 'text-normal', 'text-large')
    body.classList.add(`text-${size}`)
  }

  // Compact mode functions
  const setCompactMode = (enabled) => {
    updateSetting('compactMode', enabled)
  }

  const applyCompactMode = (enabled) => {
    const body = document.body
    if (enabled) {
      body.classList.add('compact-mode')
    } else {
      body.classList.remove('compact-mode')
    }
  }

  // Audio/Video device functions
  const setInputDevice = (deviceId) => {
    updateSetting('inputDevice', deviceId)
  }

  const setOutputDevice = (deviceId) => {
    updateSetting('outputDevice', deviceId)
  }

  const setVideoDevice = (deviceId) => {
    updateSetting('videoDevice', deviceId)
  }

  // Privacy functions
  const setAllowDMs = (setting) => {
    updateSetting('allowDMs', setting)
  }

  const setReadReceipts = (enabled) => {
    updateSetting('readReceipts', enabled)
  }

  const setOnlineStatus = (enabled) => {
    updateSetting('onlineStatus', enabled)
  }

  // Blocked users functions
  const blockUser = (userId) => {
    setSettings(prev => ({
      ...prev,
      blockedUsers: [...prev.blockedUsers, userId]
    }))
  }

  const unblockUser = (userId) => {
    setSettings(prev => ({
      ...prev,
      blockedUsers: prev.blockedUsers.filter(id => id !== userId)
    }))
  }

  const isUserBlocked = (userId) => {
    return settings.blockedUsers.includes(userId)
  }

  // Reset to defaults
  const resetSettings = () => {
    setSettings(defaultSettings)
    applyTheme(defaultSettings.theme)
    applyFontSize(defaultSettings.fontSize)
    applyCompactMode(defaultSettings.compactMode)
  }

  // Context value
  const contextValue = {
    // Settings state
    settings,
    isLoaded,
    
    // Update functions
    updateSetting,
    updateMultipleSettings,
    
    // Theme
    setTheme,
    applyTheme,
    
    // Font size
    setFontSize,
    applyFontSize,
    
    // Compact mode
    setCompactMode,
    applyCompactMode,
    
    // Audio/Video
    setInputDevice,
    setOutputDevice,
    setVideoDevice,
    
    // Privacy
    setAllowDMs,
    setReadReceipts,
    setOnlineStatus,
    
    // Blocked users
    blockUser,
    unblockUser,
    isUserBlocked,
    
    // Reset
    resetSettings
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Theme CSS classes (to be included in global CSS)
export const themeCSS = `
  /* Dark Theme (Default) */
  .theme-dark {
    --bg-primary: #36393f;
    --bg-secondary: #2f3136;
    --bg-tertiary: #202225;
    --bg-chat: #36393f;
    --bg-message: #40444b;
    --bg-hover: #3c3f45;
    --text-primary: #ffffff;
    --text-secondary: #b9bbbe;
    --text-tertiary: #72767d;
    --accent-primary: #5865f2;
    --accent-hover: #4752c4;
    --border-color: #202225;
    --success: #3ba55d;
    --warning: #faa81a;
    --danger: #ed4245;
  }

  /* Light Theme */
  .theme-light {
    --bg-primary: #ffffff;
    --bg-secondary: #f2f3f5;
    --bg-tertiary: #e3e5e8;
    --bg-chat: #ffffff;
    --bg-message: #f2f3f5;
    --bg-hover: #ebedef;
    --text-primary: #060607;
    --text-secondary: #4f5660;
    --text-tertiary: #747f8d;
    --accent-primary: #5865f2;
    --accent-hover: #4752c4;
    --border-color: #e3e5e8;
    --success: #3ba55d;
    --warning: #faa81a;
    --danger: #ed4245;
  }

  /* AMOLED Theme */
  .theme-amoled {
    --bg-primary: #000000;
    --bg-secondary: #0a0a0a;
    --bg-tertiary: #121212;
    --bg-chat: #000000;
    --bg-message: #0a0a0a;
    --bg-hover: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #b9bbbe;
    --text-tertiary: #72767d;
    --accent-primary: #5865f2;
    --accent-hover: #4752c4;
    --border-color: #121212;
    --success: #3ba55d;
    --warning: #faa81a;
    --danger: #ed4245;
  }

  /* Font Sizes */
  .text-small {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .text-normal {
    font-size: 1rem;
    line-height: 1.5rem;
  }

  .text-large {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  /* Compact Mode */
  .compact-mode .message {
    padding: 0.25rem 1rem;
  }

  .compact-mode .user-list-item {
    padding: 0.25rem 0.5rem;
  }

  .compact-mode .channel-item {
    padding: 0.25rem 0.5rem;
  }
`

export default SettingsContext