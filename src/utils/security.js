import DOMPurify from 'dompurify'

// Sanitize HTML content to prevent XSS attacks
export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'br', 'p', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'style'],
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}

// Sanitize user input text
export function sanitizeText(text) {
  if (typeof text !== 'string') return ''
  
  // Remove potentially dangerous characters
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validate and sanitize username
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Kullanıcı adı gereklidir' }
  }
  
  const sanitized = username.trim()
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Kullanıcı adı en az 2 karakter olmalıdır' }
  }
  
  if (sanitized.length > 32) {
    return { valid: false, error: 'Kullanıcı adı en fazla 32 karakter olabilir' }
  }
  
  if (!/^[a-zA-Z0-9ğüşöçİĞÜŞÖÇ_.\s-]+$/.test(sanitized)) {
    return { valid: false, error: 'Kullanıcı adı sadece harf, rakam ve bazı özel karakterleri içerebilir' }
  }
  
  return { valid: true, username: sanitized }
}

// Validate public key format
export function validatePublicKey(pubKey) {
  if (!pubKey || typeof pubKey !== 'string') {
    return { valid: false, error: 'Geçersiz public key' }
  }
  
  // Gun.js SEA public keys are typically long base64 strings
  if (pubKey.length < 50) {
    return { valid: false, error: 'Public key çok kısa' }
  }
  
  return { valid: true, pubKey }
}

// Format timestamp for display
export function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // Less than a minute
  if (diff < 60000) {
    return 'şimdi'
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} dakika önce`
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} saat önce`
  }
  
  // More than a day
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Generate secure random ID
export function generateSecureId(length = 16) {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for environments without crypto
  return Math.random().toString(36).substr(2, length)
}

// Check if device supports required features
export function checkDeviceSupport() {
  const support = {
    webRTC: !!(
      typeof RTCPeerConnection !== 'undefined' ||
      typeof webkitRTCPeerConnection !== 'undefined' ||
      typeof mozRTCPeerConnection !== 'undefined'
    ),
    mediaDevices: !!navigator.mediaDevices,
    indexedDB: !!window.indexedDB,
    localStorage: !!window.localStorage,
    notifications: 'Notification' in window,
    crypto: !!window.crypto
  }
  
  return support
}

// Request media permissions
export async function requestMediaPermissions(constraints = { audio: true, video: true }) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    
    // Stop tracks immediately to not keep camera/mic active
    stream.getTracks().forEach(track => track.stop())
    
    return { success: true, permissions: constraints }
  } catch (error) {
    console.error('Media permission request failed:', error)
    return { 
      success: false, 
      error: error.name === 'NotAllowedError' 
        ? 'Medya izinleri reddedildi' 
        : 'Medya cihazlarına erişim sağlanamadı'
    }
  }
}

// Get available media devices
export async function getAvailableDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    
    const audioInputs = devices.filter(device => device.kind === 'audioinput')
    const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
    const videoInputs = devices.filter(device => device.kind === 'videoinput')
    
    return {
      microphones: audioInputs,
      speakers: audioOutputs,
      cameras: videoInputs
    }
  } catch (error) {
    console.error('Failed to enumerate devices:', error)
    return { microphones: [], speakers: [], cameras: [] }
  }
}

// Test microphone input level
export function testMicrophone(stream, callback) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)
    
    analyser.fftSize = 256
    microphone.connect(analyser)
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      callback(average / 255) // Normalize to 0-1
      requestAnimationFrame(updateLevel)
    }
    
    updateLevel()
    
    return () => {
      microphone.disconnect()
      audioContext.close()
    }
  } catch (error) {
    console.error('Microphone test failed:', error)
    return null
  }
}

// Export key pair as JSON file
export function exportKeyPair(keyPair, filename = 'atacord_private_key.json') {
  try {
    const keyData = {
      ...keyPair,
      exportedAt: new Date().toISOString(),
      app: 'AtaCord'
    }
    
    const json = JSON.stringify(keyData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('Key export failed:', error)
    return false
  }
}

// Import key pair from JSON file
export function importKeyPair(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const keyData = JSON.parse(e.target.result)
        
        // Validate required fields
        if (!keyData.pub || !keyData.priv || !keyData.epub || !keyData.epriv) {
          reject(new Error('Geçersiz anahtar dosyası'))
          return
        }
        
        resolve(keyData)
      } catch (error) {
        reject(new Error('Anahtar dosyası okunamadı'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'))
    }
    
    reader.readAsText(file)
  })
}

// Securely store data in localStorage
export function secureSetItem(key, data) {
  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error('Failed to store data:', error)
    return false
  }
}

// Securely retrieve data from localStorage
export function secureGetItem(key) {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    
    try {
      return JSON.parse(data)
    } catch {
      return data
    }
  } catch (error) {
    console.error('Failed to retrieve data:', error)
    return null
  }
}

// Securely remove data from localStorage
export function secureRemoveItem(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Failed to remove data:', error)
    return false
  }
}

// Clear all application data
export function clearAllData() {
  try {
    // Clear localStorage items related to AtaCord
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('atacord_')) {
        localStorage.removeItem(key)
      }
    })
    
    // Note: IndexedDB clearing would require more complex implementation
    return true
  } catch (error) {
    console.error('Failed to clear data:', error)
    return false
  }
}