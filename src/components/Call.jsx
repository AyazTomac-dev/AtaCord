import React, { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'
import { 
  requestMediaPermissions,
  getAvailableDevices
} from '../utils/security'
import { useSettings } from '../context/SettingsContext'

export default function Call({ 
  currentUser, 
  targetUser, 
  onClose, 
  onCallStart,
  onCallEnd 
}) {
  const [peer, setPeer] = useState(null)
  const [call, setCall] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [callState, setCallState] = useState('initial') // initial, calling, connected, ended
  const [callType, setCallType] = useState('audio') // audio, video
  const [devices, setDevices] = useState({ microphones: [], cameras: [] })
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const callTimerRef = useRef(null)
  
  const { settings } = useSettings()

  // Initialize PeerJS
  useEffect(() => {
    if (currentUser?.pub && !peer) {
      initializePeer()
    }
    
    return () => {
      cleanup()
    }
  }, [currentUser])

  // Load devices
  useEffect(() => {
    loadDevices()
  }, [])

  // Handle streams
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
    
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const loadDevices = async () => {
    try {
      const deviceList = await getAvailableDevices()
      setDevices({
        microphones: deviceList.microphones,
        cameras: deviceList.cameras
      })
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const initializePeer = () => {
    try {
      // Create PeerJS instance with user's public key as ID
      const newPeer = new Peer(currentUser.pub, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      })

      newPeer.on('open', (id) => {
        console.log('Peer connected with ID:', id)
        setPeer(newPeer)
      })

      newPeer.on('call', (incomingCall) => {
        handleIncomingCall(incomingCall)
      })

      newPeer.on('error', (err) => {
        console.error('Peer error:', err)
        setCallState('error')
      })

      setPeer(newPeer)
    } catch (error) {
      console.error('Failed to initialize peer:', error)
      setCallState('error')
    }
  }

  const handleIncomingCall = (incomingCall) => {
    setCallState('calling')
    setCall(incomingCall)
    
    // Answer the call with local stream
    if (localStream) {
      incomingCall.answer(localStream)
      
      incomingCall.on('stream', (stream) => {
        setRemoteStream(stream)
        setCallState('connected')
        startCallTimer()
        onCallStart?.()
      })
      
      incomingCall.on('close', () => {
        endCall()
      })
      
      incomingCall.on('error', (err) => {
        console.error('Call error:', err)
        endCall()
      })
    }
  }

  const startCall = async (type = 'audio') => {
    if (!peer || !targetUser) return
    
    setCallType(type)
    setCallState('calling')
    
    try {
      // Request media permissions
      const constraints = {
        audio: {
          deviceId: settings.inputDevice ? { exact: settings.inputDevice } : undefined
        },
        video: type === 'video' ? {
          deviceId: settings.videoDevice ? { exact: settings.videoDevice } : undefined
        } : false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)
      
      // Create call to target user
      const newCall = peer.call(targetUser.pub, stream)
      setCall(newCall)
      
      newCall.on('stream', (stream) => {
        setRemoteStream(stream)
        setCallState('connected')
        startCallTimer()
        onCallStart?.()
      })
      
      newCall.on('close', () => {
        endCall()
      })
      
      newCall.on('error', (err) => {
        console.error('Call error:', err)
        endCall()
      })
      
    } catch (error) {
      console.error('Failed to start call:', error)
      setCallState('error')
    }
  }

  const endCall = () => {
    setCallState('ended')
    stopCallTimer()
    
    if (call) {
      call.close()
      setCall(null)
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    setRemoteStream(null)
    onCallEnd?.()
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const switchCamera = async () => {
    if (!localStream || devices.cameras.length < 2) return
    
    try {
      // Stop current video tracks
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach(track => track.stop())
      
      // Get next camera device
      const currentDeviceId = settings.videoDevice
      const currentIndex = devices.cameras.findIndex(d => d.deviceId === currentDeviceId)
      const nextIndex = (currentIndex + 1) % devices.cameras.length
      const nextDeviceId = devices.cameras[nextIndex].deviceId
      
      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDeviceId } }
      })
      
      // Replace video track in local stream
      const newVideoTrack = newStream.getVideoTracks()[0]
      const oldVideoTrack = localStream.getVideoTracks()[0]
      
      if (oldVideoTrack) {
        localStream.removeTrack(oldVideoTrack)
      }
      
      localStream.addTrack(newVideoTrack)
      
      // Update video ref
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
      }
      
      // Update settings
      useSettings().setVideoDevice(nextDeviceId)
      
    } catch (error) {
      console.error('Failed to switch camera:', error)
    }
  }

  const startCallTimer = () => {
    let seconds = 0
    callTimerRef.current = setInterval(() => {
      seconds++
      setCallDuration(seconds)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
    setCallDuration(0)
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const cleanup = () => {
    if (call) {
      call.close()
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    
    if (peer) {
      peer.destroy()
    }
    
    stopCallTimer()
  }

  const renderCallInterface = () => {
    if (callState === 'initial') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-text-primary">
          <div className="text-6xl mb-6">📞</div>
          <h2 className="text-2xl font-bold mb-2">
            {targetUser ? 'Arama Yap' : 'Gelen Arama'}
          </h2>
          <p className="text-text-secondary mb-8 text-center">
            {targetUser 
              ? `${targetUser.pub.substring(0, 16)}... kişisini ara`
              : 'Bir kullanıcı sizi arıyor'
            }
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={() => startCall('audio')}
              className="bg-accent-primary hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" clipRule="evenodd" />
              </svg>
              Sesli Ara
            </button>
            
            <button
              onClick={() => startCall('video')}
              className="bg-success hover:bg-success/80 text-white px-6 py-3 rounded-lg font-medium transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              Görüntülü Ara
            </button>
          </div>
        </div>
      )
    }

    if (callState === 'calling') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-text-primary">
          <div className="text-6xl mb-6 animate-pulse">📞</div>
          <h2 className="text-2xl font-bold mb-2">
            {targetUser ? 'Aranıyor...' : 'Gelen Arama'}
          </h2>
          <p className="text-text-secondary mb-8">
            {targetUser 
              ? `${targetUser.pub.substring(0, 16)}...`
              : 'Bir kullanıcı sizi arıyor'
            }
          </p>
          
          <button
            onClick={endCall}
            className="bg-danger hover:bg-danger/80 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            İptal
          </button>
        </div>
      )
    }

    if (callState === 'connected') {
      return (
        <div className="h-full flex flex-col">
          {/* Call header */}
          <div className="p-4 border-b border-border-color flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {callType === 'video' ? 'Görüntülü Arama' : 'Sesli Arama'}
              </h2>
              <p className="text-text-secondary text-sm">
                {formatCallDuration(callDuration)}
              </p>
            </div>
            <button
              onClick={endCall}
              className="bg-danger hover:bg-danger/80 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Bitir
            </button>
          </div>
          
          {/* Video area */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {/* Remote video */}
            {callType === 'video' && remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Local video (picture-in-picture) */}
            {callType === 'video' && localStream && (
              <div className="absolute top-4 right-4 w-32 h-24 bg-bg-secondary rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Audio call placeholder */}
            {callType === 'audio' && (
              <div className="text-center text-white">
                <div className="text-8xl mb-4">👤</div>
                <h2 className="text-2xl font-bold mb-2">
                  Sesli Arama Devam Ediyor
                </h2>
                <p className="text-text-secondary">
                  {targetUser?.pub.substring(0, 16)}...
                </p>
              </div>
            )}
          </div>
          
          {/* Call controls */}
          <div className="p-6 bg-bg-secondary border-t border-border-color">
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition ${
                  isMuted 
                    ? 'bg-danger hover:bg-danger/80' 
                    : 'bg-bg-tertiary hover:bg-bg-hover'
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  {isMuted ? (
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.793a1 1 0 011.617-.097zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.793a1 1 0 011.617-.097z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
              
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition ${
                    !isVideoEnabled 
                      ? 'bg-danger hover:bg-danger/80' 
                      : 'bg-bg-tertiary hover:bg-bg-hover'
                  }`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    {isVideoEnabled ? (
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    ) : (
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              )}
              
              {callType === 'video' && devices.cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-4 rounded-full bg-bg-tertiary hover:bg-bg-hover transition"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-danger hover:bg-danger/80 transition"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (callState === 'ended' || callState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-text-primary">
          <div className="text-6xl mb-6">
            {callState === 'error' ? '⚠️' : '📞'}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {callState === 'error' ? 'Arama Hatası' : 'Arama Bitti'}
          </h2>
          <p className="text-text-secondary mb-8 text-center">
            {callState === 'error' 
              ? 'Arama başlatılırken bir hata oluştu'
              : 'Arama başarıyla sonlandırıldı'
            }
          </p>
          
          <button
            onClick={onClose}
            className="bg-accent-primary hover:bg-accent-hover text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Kapat
          </button>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-bg-primary z-50 flex flex-col">
      {renderCallInterface()}
    </div>
  )
}