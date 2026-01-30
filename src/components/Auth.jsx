import React, { useState, useEffect } from 'react'
import { 
  generateKeyPair, 
  authenticateUser, 
  createUser,
  getCurrentUser
} from '../utils/gun'
import { 
  validateUsername, 
  exportKeyPair, 
  importKeyPair,
  secureSetItem,
  secureGetItem
} from '../utils/security'
import { useSettings } from '../context/SettingsContext'

export default function Auth({ onLogin }) {
  const [authMode, setAuthMode] = useState('login') // 'login', 'register', 'import'
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyFile, setKeyFile] = useState(null)
  const { settings } = useSettings()

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const savedPair = secureGetItem('atacord_user_pair')
        const savedUsername = secureGetItem('atacord_username')
        
        if (savedPair && savedUsername) {
          setIsLoading(true)
          try {
            await authenticateUser(savedPair)
            onLogin(savedPair, savedUsername)
          } catch (err) {
            // Session invalid, clear saved data
            secureSetItem('atacord_user_pair', null)
            secureSetItem('atacord_username', null)
          }
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Session check failed:', err)
      }
    }

    checkExistingSession()
  }, [onLogin])

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    if (isLoading) return
    
    // Validate username
    const validation = validateUsername(username)
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    
    setIsLoading(true)
    
    try {
      // Generate new key pair
      const pair = await generateKeyPair()
      
      // Create user account
      await createUser(validation.username, pair)
      
      // Save credentials locally
      secureSetItem('atacord_user_pair', pair)
      secureSetItem('atacord_username', validation.username)
      
      // Notify parent component
      onLogin(pair, validation.username)
      
    } catch (err) {
      console.error('Registration failed:', err)
      setError('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      // Try to get saved key pair
      const savedPair = secureGetItem('atacord_user_pair')
      
      if (!savedPair) {
        setError('Kayıtlı oturum bulunamadı. Lütfen "Anahtarla Giriş Yap" seçeneğini kullanın.')
        setIsLoading(false)
        return
      }
      
      // Authenticate with saved key pair
      await authenticateUser(savedPair)
      
      const savedUsername = secureGetItem('atacord_username') || 'Kullanıcı'
      
      // Notify parent component
      onLogin(savedPair, savedUsername)
      
    } catch (err) {
      console.error('Login failed:', err)
      setError('Oturum açma başarısız oldu. Anahtar geçersiz olabilir.')
      secureSetItem('atacord_user_pair', null)
      secureSetItem('atacord_username', null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportKey = async (e) => {
    e.preventDefault()
    setError('')
    
    if (isLoading || !keyFile) {
      setError('Lütfen bir anahtar dosyası seçin.')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Import key pair from file
      const keyPair = await importKeyPair(keyFile)
      
      // Authenticate with imported key
      await authenticateUser(keyPair)
      
      // Try to get username from profile or use default
      const username = secureGetItem('atacord_username') || 'İçe Aktarılan Kullanıcı'
      
      // Save imported credentials
      secureSetItem('atacord_user_pair', keyPair)
      secureSetItem('atacord_username', username)
      
      // Notify parent component
      onLogin(keyPair, username)
      
    } catch (err) {
      console.error('Key import failed:', err)
      setError(err.message || 'Anahtar dosyası içe aktarılamadı.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportKey = async () => {
    try {
      const currentPair = secureGetItem('atacord_user_pair')
      if (!currentPair) {
        setError('Dışa aktarılacak anahtar bulunamadı.')
        return
      }
      
      const success = exportKeyPair(currentPair, `atacord_key_${Date.now()}.json`)
      if (!success) {
        setError('Anahtar dışa aktarılamadı.')
      }
    } catch (err) {
      console.error('Key export failed:', err)
      setError('Anahtar dışa aktarma işlemi başarısız oldu.')
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setKeyFile(e.target.files[0])
      setError('')
    }
  }

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-center mb-6 text-text-primary">
          AtaCord'a Hoş Geldiniz
        </h2>
        <p className="text-center text-text-secondary mb-6">
          Merkezi sunucusuz, şifreli bir sohbet uygulaması
        </p>
      </div>
      
      {error && (
        <div className="bg-danger/20 border border-danger/30 rounded-lg p-3 text-danger text-center">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent-primary hover:bg-accent-hover text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Giriş Yapılıyor...' : 'Oturum Aç'}
        </button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-primary text-text-tertiary">veya</span>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className="w-full bg-bg-secondary hover:bg-bg-hover text-text-primary font-medium py-3 px-4 rounded-lg border border-border-color transition duration-200"
        >
          Yeni Hesap Oluştur
        </button>
        
        <button
          type="button"
          onClick={() => setAuthMode('import')}
          className="w-full bg-bg-secondary hover:bg-bg-hover text-text-primary font-medium py-3 px-4 rounded-lg border border-border-color transition duration-200"
        >
          Anahtarla Giriş Yap
        </button>
      </div>
    </form>
  )

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Yeni Hesap Oluştur
        </h2>
        <p className="text-text-secondary">
          Güvenli, merkezi olmayan bir kimlik oluşturun
        </p>
      </div>
      
      {error && (
        <div className="bg-danger/20 border border-danger/30 rounded-lg p-3 text-danger text-center">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Kullanıcı Adı
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-bg-secondary border border-border-color rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition"
          placeholder="Kullanıcı adınızı girin"
          disabled={isLoading}
          maxLength={32}
        />
        <p className="text-xs text-text-tertiary mt-1">
          Harf, rakam, boşluk, tire ve alt çizgi içerebilir (2-32 karakter)
        </p>
      </div>
      
      <div className="bg-bg-secondary/50 border border-warning/20 rounded-lg p-4">
        <h3 className="font-medium text-warning mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Önemli Güvenlik Uyarısı
        </h3>
        <p className="text-sm text-text-secondary">
          Hesabınız otomatik olarak oluşturulacak şifreli bir anahtarla korunuyor. 
          Tarayıcı verilerinizi temizlerseniz hesabı kurtarmak için "Gizli Anahtarı İndir" özelliğini kullanın.
        </p>
        <button
          type="button"
          onClick={handleExportKey}
          className="mt-3 text-sm text-accent-primary hover:text-accent-hover font-medium"
        >
          Gizli Anahtarı İndir
        </button>
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          disabled={isLoading}
          className="flex-1 bg-bg-secondary hover:bg-bg-hover text-text-primary font-medium py-3 px-4 rounded-lg border border-border-color transition duration-200 disabled:opacity-50"
        >
          Geri
        </button>
        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="flex-1 bg-success hover:bg-success/80 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
        </button>
      </div>
    </form>
  )

  const renderImportForm = () => (
    <form onSubmit={handleImportKey} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Anahtarla Giriş Yap
        </h2>
        <p className="text-text-secondary">
          Daha önce dışa aktardığınız anahtar dosyasını içe aktarın
        </p>
      </div>
      
      {error && (
        <div className="bg-danger/20 border border-danger/30 rounded-lg p-3 text-danger text-center">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Anahtar Dosyası
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          <div className="bg-bg-secondary border border-border-color rounded-lg px-4 py-3 text-text-primary cursor-pointer hover:bg-bg-hover transition">
            {keyFile ? keyFile.name : 'JSON dosyası seçin...'}
          </div>
        </div>
        <p className="text-xs text-text-tertiary mt-1">
          Daha önce dışa aktardığınız atacord_private_key.json dosyasını seçin
        </p>
      </div>
      
      <div className="bg-bg-secondary/50 border border-accent-primary/20 rounded-lg p-4">
        <h3 className="font-medium text-accent-primary mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Güvenlik Bilgisi
        </h3>
        <p className="text-sm text-text-secondary">
          Anahtar dosyanız şifrelenmemiştir. Güvenli bir yerde sakladığınızdan emin olun.
        </p>
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          disabled={isLoading}
          className="flex-1 bg-bg-secondary hover:bg-bg-hover text-text-primary font-medium py-3 px-4 rounded-lg border border-border-color transition duration-200 disabled:opacity-50"
        >
          Geri
        </button>
        <button
          type="submit"
          disabled={isLoading || !keyFile}
          className="flex-1 bg-accent-primary hover:bg-accent-hover text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'İçe Aktarılıyor...' : 'Anahtarı İçe Aktar'}
        </button>
      </div>
    </form>
  )

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-bg-primary' : settings.theme === 'light' ? 'bg-bg-primary' : 'bg-bg-primary'}`}>
      <div className="w-full max-w-md">
        <div className="bg-bg-secondary rounded-xl shadow-xl p-8 border border-border-color">
          {authMode === 'login' && renderLoginForm()}
          {authMode === 'register' && renderRegisterForm()}
          {authMode === 'import' && renderImportForm()}
        </div>
        
        <div className="text-center mt-8 text-text-tertiary text-sm">
          <p>AtaCord - Merkezi Olmayan Türkçe Sohbet</p>
          <p className="mt-1">P2P • E2EE • Açık Kaynak</p>
        </div>
      </div>
    </div>
  )
}