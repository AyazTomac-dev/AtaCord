import React, { useState, useEffect } from 'react'
import { SettingsProvider } from './context/SettingsContext'
import Auth from './components/Auth'
import Chat from './components/Chat'
import SettingsModal from './components/SettingsModal'
import Call from './components/Call'
import { themeCSS } from './context/SettingsContext'
import { checkDeviceSupport } from './utils/security'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [deviceSupport, setDeviceSupport] = useState(null)

  // Check device support on mount
  useEffect(() => {
    const support = checkDeviceSupport()
    setDeviceSupport(support)
    
    // Inject theme CSS
    const style = document.createElement('style')
    style.textContent = themeCSS
    document.head.appendChild(style)
    
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [])

  const handleLogin = (userPair, username) => {
    setCurrentUser(userPair)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setShowSettings(false)
    setActiveCall(null)
    
    // Clear local storage
    localStorage.removeItem('atacord_user_pair')
    localStorage.removeItem('atacord_username')
  }

  const handleOpenSettings = () => {
    setShowSettings(true)
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
  }

  const handleStartCall = (targetUser, callType = 'audio') => {
    setActiveCall({
      targetUser,
      type: callType
    })
  }

  const handleEndCall = () => {
    setActiveCall(null)
  }

  const renderDeviceSupportWarning = () => {
    if (!deviceSupport) return null
    
    const missingFeatures = []
    
    if (!deviceSupport.webRTC) missingFeatures.push('WebRTC')
    if (!deviceSupport.mediaDevices) missingFeatures.push('Medya Cihazları')
    if (!deviceSupport.indexedDB) missingFeatures.push('IndexedDB')
    if (!deviceSupport.crypto) missingFeatures.push('Kriptografi')
    
    if (missingFeatures.length === 0) return null
    
    return (
      <div className="bg-warning/20 border border-warning/30 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-warning mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Tarayıcı Uyumluluğu Uyarısı
        </h3>
        <p className="text-sm text-text-secondary">
          Tarayıcınız aşağıdaki özellikler için destek sunmuyor: {missingFeatures.join(', ')}
          Bu özellikler olmadan sesli/görüntülü aramalar çalışmayabilir.
        </p>
      </div>
    )
  }

  // Show auth screen if not logged in
  if (!currentUser) {
    return (
      <SettingsProvider>
        <div className="theme-dark">
          {renderDeviceSupportWarning()}
          <Auth onLogin={handleLogin} />
        </div>
      </SettingsProvider>
    )
  }

  // Show main app when logged in
  return (
    <SettingsProvider>
      <div className="theme-dark h-screen">
        {renderDeviceSupportWarning()}
        
        <Chat 
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          onStartCall={handleStartCall}
        />
        
        {showSettings && (
          <SettingsModal 
            isOpen={showSettings}
            onClose={handleCloseSettings}
            currentUser={currentUser}
          />
        )}
        
        {activeCall && (
          <Call
            currentUser={currentUser}
            targetUser={activeCall.targetUser}
            callType={activeCall.type}
            onClose={handleEndCall}
            onCallStart={() => console.log('Call started')}
            onCallEnd={handleEndCall}
          />
        )}
      </div>
    </SettingsProvider>
  )
}

export default App