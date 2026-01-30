import React, { useState, useEffect, useRef } from 'react'
import { 
  getMessages, 
  sendMessage, 
  getDirectMessages,
  sendDirectMessage,
  getFriends,
  addFriend,
  getUserProfile,
  storeUserProfile,
  setOnlineStatus,
  getOnlineStatus
} from '../utils/gun'
import { 
  sanitizeHTML, 
  formatTimestamp,
  validatePublicKey
} from '../utils/security'
import { useSettings } from '../context/SettingsContext'

export default function Chat({ currentUser, onLogout, onOpenSettings }) {
  const [activeView, setActiveView] = useState('friends') // 'friends', 'server', 'dm'
  const [messages, setMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [onlineStatus, setOnlineStatus] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedServer, setSelectedServer] = useState(null)
  const [servers, setServers] = useState([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendPublicKey, setFriendPublicKey] = useState('')
  const [friendError, setFriendError] = useState('')
  const messagesEndRef = useRef(null)
  const { settings, isUserBlocked } = useSettings()

  // Set user online status
  useEffect(() => {
    if (currentUser?.pub) {
      setOnlineStatus(currentUser.pub, true)
      
      // Set offline when component unmounts
      return () => {
        setOnlineStatus(currentUser.pub, false)
      }
    }
  }, [currentUser])

  // Load friends list
  useEffect(() => {
    if (currentUser?.pub) {
      loadFriends()
    }
  }, [currentUser])

  // Load messages when view changes
  useEffect(() => {
    loadMessages()
  }, [activeView, selectedFriend, selectedServer])

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadFriends = async () => {
    try {
      const friendsNode = getFriends(currentUser.pub)
      
      friendsNode.on((data) => {
        if (data && typeof data === 'object') {
          const friendList = Object.keys(data)
            .filter(key => key !== '_' && data[key])
            .map(pubKey => ({ pub: pubKey, addedAt: data[pubKey].addedAt }))
          
          setFriends(friendList)
          
          // Load online status for friends
          friendList.forEach(friend => {
            const statusNode = getOnlineStatus(friend.pub)
            statusNode.on((status) => {
              setOnlineStatus(prev => ({
                ...prev,
                [friend.pub]: status?.online || false
              }))
            })
          })
        }
      })
    } catch (error) {
      console.error('Failed to load friends:', error)
    }
  }

  const loadMessages = () => {
    try {
      let messageNode
      
      if (activeView === 'dm' && selectedFriend) {
        messageNode = getDirectMessages(currentUser.pub, selectedFriend.pub)
      } else if (activeView === 'server' && selectedServer) {
        messageNode = getMessages(selectedServer.id)
      } else {
        setMessages([])
        return
      }
      
      messageNode.on((data) => {
        if (data && typeof data === 'object') {
          const messageList = Object.keys(data)
            .filter(key => key !== '_' && data[key])
            .map(key => data[key])
            .filter(msg => !isUserBlocked(msg.sender))
            .sort((a, b) => a.timestamp - b.timestamp)
          
          setMessages(messageList)
        }
      })
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !currentUser) return
    
    try {
      const messageData = {
        content: newMessage.trim(),
        sender: currentUser.pub,
        senderName: secureGetItem('atacord_username') || 'Kullanıcı'
      }
      
      if (activeView === 'dm' && selectedFriend) {
        await sendDirectMessage(selectedFriend.pub, messageData, currentUser)
      } else if (activeView === 'server' && selectedServer) {
        sendMessage(selectedServer.id, messageData)
      }
      
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleAddFriend = async () => {
    setFriendError('')
    
    const validation = validatePublicKey(friendPublicKey)
    if (!validation.valid) {
      setFriendError(validation.error)
      return
    }
    
    try {
      await addFriend(currentUser.pub, validation.pubKey)
      setFriendPublicKey('')
      setShowAddFriend(false)
      loadFriends() // Refresh friends list
    } catch (error) {
      console.error('Failed to add friend:', error)
      setFriendError('Arkadaş eklenemedi')
    }
  }

  const renderFriendsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-color">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Arkadaşlar</h2>
          <button
            onClick={() => setShowAddFriend(true)}
            className="text-accent-primary hover:text-accent-hover"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {friends.length === 0 ? (
          <div className="p-4 text-center text-text-secondary">
            <div className="text-4xl mb-2">👋</div>
            <p>Henüz hiç arkadaşın yok</p>
            <p className="text-sm mt-1">Yukarıdaki + butonuyla arkadaş ekle</p>
          </div>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.pub}
              onClick={() => {
                setSelectedFriend(friend)
                setActiveView('dm')
              }}
              className={`p-3 border-b border-border-color cursor-pointer hover:bg-bg-hover transition ${
                activeView === 'dm' && selectedFriend?.pub === friend.pub
                  ? 'bg-bg-hover'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white font-semibold mr-3">
                    {friend.pub.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {friend.pub.substring(0, 16)}...
                    </div>
                    <div className="text-xs text-text-secondary">
                      {onlineStatus[friend.pub] ? 'Çevrimiçi' : 'Çevrimdışı'}
                    </div>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  onlineStatus[friend.pub] ? 'bg-success' : 'bg-text-tertiary'
                }`}></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderServerList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-color">
        <h2 className="text-lg font-semibold text-text-primary">Topluluklar</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {servers.length === 0 ? (
          <div className="p-4 text-center text-text-secondary">
            <div className="text-4xl mb-2">🏛️</div>
            <p>Henüz hiç topluluğun yok</p>
            <p className="text-sm mt-1">Gelecekte topluluk oluşturulabilecek</p>
          </div>
        ) : (
          servers.map((server) => (
            <div
              key={server.id}
              onClick={() => {
                setSelectedServer(server)
                setActiveView('server')
              }}
              className={`p-3 border-b border-border-color cursor-pointer hover:bg-bg-hover transition ${
                activeView === 'server' && selectedServer?.id === server.id
                  ? 'bg-bg-hover'
                  : ''
              }`}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center text-white font-bold text-lg mr-3">
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-text-primary">{server.name}</div>
                  <div className="text-xs text-text-secondary">{server.memberCount} üye</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderMessageArea = () => {
    const title = activeView === 'dm' 
      ? `Direkt Mesaj - ${selectedFriend?.pub.substring(0, 16)}...`
      : selectedServer?.name || 'Mesajlaşma'

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border-color flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSettings}
              className="text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-bg-hover transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.547-.549 3.089.026 3.089 1.833 0 1.137-.82 2.058-1.964 2.058H13.5" />
              </svg>
            </button>
            <button
              onClick={onLogout}
              className="text-text-secondary hover:text-danger p-2 rounded-lg hover:bg-bg-hover transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-secondary">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {activeView === 'dm' ? '💬' : '📢'}
                </div>
                <p>Henüz mesaj yok</p>
                <p className="text-sm mt-1">
                  {activeView === 'dm' 
                    ? 'Arkadaşına bir mesaj gönder' 
                    : 'Topluluğa bir mesaj gönder'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === currentUser.pub ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === currentUser.pub
                        ? 'bg-accent-primary text-white rounded-br-none'
                        : 'bg-bg-message text-text-primary rounded-bl-none'
                    }`}
                  >
                    {message.sender !== currentUser.pub && (
                      <div className="text-xs font-medium mb-1 opacity-80">
                        {message.senderName || message.sender.substring(0, 16)}...
                      </div>
                    )}
                    <div
                      className="whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHTML(message.content)
                      }}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === currentUser.pub
                          ? 'text-white/70'
                          : 'text-text-secondary'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="p-4 border-t border-border-color">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                activeView === 'dm'
                  ? `${selectedFriend?.pub.substring(0, 16)}... kişisine mesaj yaz`
                  : 'Mesaj yaz...'
              }
              className="flex-1 bg-bg-secondary border border-border-color rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              disabled={!selectedFriend && !selectedServer}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || (!selectedFriend && !selectedServer)}
              className="bg-accent-primary hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gönder
            </button>
          </form>
        </div>
      </div>
    )
  }

  const renderAddFriendModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-xl shadow-xl w-full max-w-md p-6 border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Arkadaş Ekle</h3>
        
        {friendError && (
          <div className="bg-danger/20 border border-danger/30 rounded-lg p-3 text-danger mb-4">
            {friendError}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Arkadaşın Public Key'i
          </label>
          <input
            type="text"
            value={friendPublicKey}
            onChange={(e) => setFriendPublicKey(e.target.value)}
            className="w-full bg-bg-secondary border border-border-color rounded-lg px-3 py-2 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Arkadaşının public key'ini buraya yapıştır"
          />
          <p className="text-xs text-text-tertiary mt-1">
            Arkadaşınızın kullanıcı ID'sini (public key) almanız gerekiyor
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowAddFriend(false)
              setFriendPublicKey('')
              setFriendError('')
            }}
            className="flex-1 bg-bg-secondary hover:bg-bg-hover text-text-primary font-medium py-2 px-4 rounded-lg border border-border-color transition"
          >
            İptal
          </button>
          <button
            onClick={handleAddFriend}
            disabled={!friendPublicKey.trim()}
            className="flex-1 bg-accent-primary hover:bg-accent-hover text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            Ekle
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar - Friends/Server List */}
      <div className="w-64 bg-bg-secondary border-r border-border-color flex flex-col">
        <div className="p-4 border-b border-border-color">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-text-primary">AtaCord</h1>
            <div className="w-3 h-3 rounded-full bg-success"></div>
          </div>
          <div className="text-sm text-text-secondary mt-1">
            Merkezi Olmayan Sohbet
          </div>
        </div>
        
        <div className="flex border-b border-border-color">
          <button
            onClick={() => setActiveView('friends')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeView === 'friends'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Arkadaşlar
          </button>
          <button
            onClick={() => setActiveView('server')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeView === 'server'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Topluluklar
          </button>
        </div>
        
        {activeView === 'friends' && renderFriendsList()}
        {activeView === 'server' && renderServerList()}
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeView === 'friends' && !selectedFriend && (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-bold mb-2">Arkadaş Seç</h2>
              <p>Sohbet etmek için bir arkadaş seç</p>
            </div>
          </div>
        )}
        
        {activeView === 'server' && !selectedServer && (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <div className="text-6xl mb-4">🏛️</div>
              <h2 className="text-2xl font-bold mb-2">Topluluk Seç</h2>
              <p>Katılmak için bir topluluk seç</p>
            </div>
          </div>
        )}
        
        {(selectedFriend || selectedServer) && renderMessageArea()}
      </div>
      
      {/* User Info Panel (Right sidebar) */}
      <div className="w-64 bg-bg-secondary border-l border-border-color">
        <div className="p-4 border-b border-border-color">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white font-semibold mr-3">
              {currentUser?.pub.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-text-primary">
                {secureGetItem('atacord_username') || 'Kullanıcı'}
              </div>
              <div className="text-xs text-success">Çevrimiçi</div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-text-primary mb-3">Kullanıcı Bilgileri</h3>
          <div className="text-sm text-text-secondary">
            <div className="mb-2">
              <span className="font-medium">ID:</span>
              <div className="font-mono text-xs mt-1 break-all">
                {currentUser?.pub.substring(0, 32)}...
              </div>
            </div>
            <div>
              <span className="font-medium">Durum:</span>
              <span className="ml-2 text-success">Çevrimiçi</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showAddFriend && renderAddFriendModal()}
    </div>
  )
}