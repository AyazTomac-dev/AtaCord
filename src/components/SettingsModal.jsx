import React, { useState, useEffect } from 'react'
import { 
  exportKeyPair, 
  getAvailableDevices, 
  testMicrophone,
  clearAllData,
  secureGetItem
} from '../utils/security'
import { useSettings } from '../context/SettingsContext'

export default function SettingsModal({ isOpen, onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState('account')
  const [devices, setDevices] = useState({ microphones: [], speakers: [], cameras: [] })
  const [testActive, setTestActive] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const { 
    settings, 
    setTheme, 
    setFontSize, 
    setCompactMode,
    setInputDevice,
    setOutputDevice,
    setVideoDevice,
    setAllowDMs,
    setReadReceipts
  } = useSettings()

  // Load user data on mount
  useEffect(() => {
    if (isOpen && currentUser) {
      const savedUsername = secureGetItem('atacord_username') || ''
      const savedAvatar = secureGetItem('atacord_avatar') || ''
      setUsername(savedUsername)
      setAvatar(savedAvatar)
    }
  }, [isOpen, currentUser])

  // Load devices when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDevices()
    }
  }, [isOpen])

  const loadDevices = async () => {
    try {
      const deviceList = await getAvailableDevices()
      setDevices(deviceList)
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const handleTestMicrophone = async () => {
    if (testActive) {
      setTestActive(false)
      setMicLevel(0)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setTestActive(true)
      
      const stopTest = testMicrophone(stream, (level) => {
        setMicLevel(level)
      })
      
      // Auto stop after 10 seconds
      setTimeout(() => {
        stopTest()
        stream.getTracks().forEach(track => track.stop())
        setTestActive(false)
        setMicLevel(0)
      }, 10000)
      
    } catch (error) {
      console.error('Microphone test failed:', error)
    }
  }

  const handleExportKey = () => {
    const currentPair = secureGetItem('atacord_user_pair')
    if (currentPair) {
      exportKeyPair(currentPair, `atacord_key_${Date.now()}.json`)
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      clearAllData()
      window.location.reload()
    }
  }

  const handleSaveProfile = () => {
    // Save profile data
    secureGetItem('atacord_username', username)
    secureGetItem('atacord_avatar', avatar)
    // In a real app, you'd also update the Gun.js profile
    alert('Profil güncellendi!')
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'account', label: 'Hesabım', icon: '👤' },
    { id: 'appearance', label: 'Görünüm', icon: '🎨' },
    { id: 'audio', label: 'Ses ve Görüntü', icon: '🎙️' },
    { id: 'privacy', label: 'Gizlilik', icon: '🔒' }
  ]

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Hesap Bilgileri</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Kullanıcı adınız"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Avatar URL
            </label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Avatar URL'nizi girin"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="bg-accent-primary hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Kullanıcı ID</h3>
        <div className="bg-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <code className="text-sm text-text-secondary font-mono break-all">
              {currentUser?.pub || 'Oturum açılmadı'}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentUser?.pub || '')
                alert('Kopyalandı!')
              }}
              className="ml-2 text-accent-primary hover:text-accent-hover"
            >
              Kopyala
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-bg-secondary rounded-lg p-4 border border-warning/20">
        <h3 className="font-medium text-warning mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Tehlike Bölgesi
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleExportKey}
            className="w-full text-left bg-bg-tertiary hover:bg-danger/10 text-warning hover:text-danger px-4 py-3 rounded-lg border border-warning/20 hover:border-danger/30 transition"
          >
            <div className="font-medium">Hesap Anahtarını İndir</div>
            <div className="text-sm text-text-secondary">
              Hesabınızı kurtarmak için gizli anahtarınızı dışa aktarın
            </div>
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full text-left bg-bg-tertiary hover:bg-danger/10 text-warning hover:text-danger px-4 py-3 rounded-lg border border-warning/20 hover:border-danger/30 transition"
          >
            <div className="font-medium">Hesabı Sil</div>
            <div className="text-sm text-text-secondary">
              Tüm yerel verileri sil ve oturumu kapat
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Tema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: 'dark', name: 'Koyu', desc: 'Discord benzeri koyu tema' },
            { id: 'light', name: 'Açık', desc: 'Açık renkli tema' },
            { id: 'amoled', name: 'AMOLED', desc: 'Siyah ekran dostu tema' }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`p-4 rounded-lg border-2 transition ${
                settings.theme === theme.id
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-color hover:border-text-secondary'
              }`}
            >
              <div className={`w-full h-20 rounded mb-3 ${
                theme.id === 'dark' ? 'bg-gray-800' :
                theme.id === 'light' ? 'bg-gray-200' :
                'bg-black'
              }`}></div>
              <div className="text-center">
                <div className={`font-medium ${
                  settings.theme === theme.id ? 'text-accent-primary' : 'text-text-primary'
                }`}>
                  {theme.name}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {theme.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Yazı Boyutu</h3>
        <div className="space-y-3">
          {[
            { id: 'small', name: 'Küçük' },
            { id: 'normal', name: 'Normal' },
            { id: 'large', name: 'Büyük' }
          ].map((size) => (
            <button
              key={size.id}
              onClick={() => setFontSize(size.id)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                settings.fontSize === size.id
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-color hover:border-text-secondary text-text-primary'
              }`}
            >
              <div className={`font-medium ${settings.fontSize === size.id ? '' : 'text-text-primary'}`}>
                {size.name} Yazı
              </div>
              <div className={`text-sm ${settings.fontSize === size.id ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                {size.id === 'small' ? 'Küçük metin boyutu' :
                 size.id === 'normal' ? 'Varsayılan metin boyutu' :
                 'Büyük metin boyutu'}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Görünüm Seçenekleri</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg border border-border-color hover:border-text-secondary cursor-pointer">
            <div>
              <div className="font-medium text-text-primary">Kompakt Mod</div>
              <div className="text-sm text-text-secondary">
                Sohbet mesajlarını daha yoğun göster
              </div>
            </div>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-12 h-6 rounded-full transition ${
                settings.compactMode ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.compactMode ? 'transform translate-x-6' : ''
              }`}></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderAudioTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Ses Aygıtları</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Mikrofon
            </label>
            <select
              value={settings.inputDevice || ''}
              onChange={(e) => setInputDevice(e.target.value || null)}
              className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="">Sistem varsayılanı</option>
              {devices.microphones.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Mikrofon ${device.deviceId.substr(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Hoparlör
            </label>
            <select
              value={settings.outputDevice || ''}
              onChange={(e) => setOutputDevice(e.target.value || null)}
              className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="">Sistem varsayılanı</option>
              {devices.speakers.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Hoparlör ${device.deviceId.substr(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Görüntü Aygıtları</h3>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Kamera
          </label>
          <select
            value={settings.videoDevice || ''}
            onChange={(e) => setVideoDevice(e.target.value || null)}
            className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="">Kamera kullanma</option>
            {devices.cameras.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Kamera ${device.deviceId.substr(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Test</h3>
        <div className="bg-bg-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-primary">Mikrofonu Test Et</span>
            <button
              onClick={handleTestMicrophone}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                testActive
                  ? 'bg-danger hover:bg-danger/80 text-white'
                  : 'bg-accent-primary hover:bg-accent-hover text-white'
              }`}
            >
              {testActive ? 'Durdur' : 'Test Et'}
            </button>
          </div>
          
          {testActive && (
            <div className="space-y-2">
              <div className="text-sm text-text-secondary">Mikrofon seviyesi:</div>
              <div className="w-full bg-bg-tertiary rounded-full h-2.5">
                <div
                  className="bg-accent-primary h-2.5 rounded-full transition-all duration-100"
                  style={{ width: `${micLevel * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-text-tertiary">
                Konuşmaya başlayın veya mikrofonunuza ses verin
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Mesajlaşma Ayarları</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Direkt Mesajlara İzin Ver
            </label>
            <select
              value={settings.allowDMs}
              onChange={(e) => setAllowDMs(e.target.value)}
              className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="everyone">Herkesten</option>
              <option value="friends">Sadece arkadaşlardan</option>
            </select>
          </div>
          
          <label className="flex items-center justify-between p-3 rounded-lg border border-border-color hover:border-text-secondary cursor-pointer">
            <div>
              <div className="font-medium text-text-primary">Okundu Bilgisi</div>
              <div className="text-sm text-text-secondary">
                Mesajların okunduğunu göster
              </div>
            </div>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={settings.readReceipts}
                onChange={(e) => setReadReceipts(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-12 h-6 rounded-full transition ${
                settings.readReceipts ? 'bg-accent-primary' : 'bg-bg-tertiary'
              }`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.readReceipts ? 'transform translate-x-6' : ''
              }`}></div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Çevrimiçi Durum</h3>
        <label className="flex items-center justify-between p-3 rounded-lg border border-border-color hover:border-text-secondary cursor-pointer">
          <div>
            <div className="font-medium text-text-primary">Çevrimiçi Durumunu Göster</div>
            <div className="text-sm text-text-secondary">
              Arkadaşlarınız çevrimiçi durumunuzu görebilir
            </div>
          </div>
          <div className="relative inline-block w-12 h-6">
            <input
              type="checkbox"
              checked={settings.onlineStatus}
              onChange={(e) => useSettings().setOnlineStatus(e.target.checked)}
              className="sr-only"
            />
            <div className={`block w-12 h-6 rounded-full transition ${
              settings.onlineStatus ? 'bg-accent-primary' : 'bg-bg-tertiary'
            }`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
              settings.onlineStatus ? 'transform translate-x-6' : ''
            }`}></div>
          </div>
        </label>
      </div>
      
      <div className="bg-bg-secondary rounded-lg p-4 border border-warning/20">
        <h3 className="font-medium text-warning mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Veri Saklama
        </h3>
        <p className="text-sm text-text-secondary">
          Tüm verileriniz tarayıcınızda yerel olarak saklanır. 
          Tarayıcı verilerinizi temizlerseniz, dışa aktardığınız anahtar dosyası ile 
          hesabınızı kurtarabilirsiniz.
        </p>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account': return renderAccountTab()
      case 'appearance': return renderAppearanceTab()
      case 'audio': return renderAudioTab()
      case 'privacy': return renderPrivacyTab()
      default: return renderAccountTab()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border-color">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">Ayarlar</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-bg-hover transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-border-color bg-bg-secondary">
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left mb-1 transition ${
                    activeTab === tab.id
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}