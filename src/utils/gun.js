import Gun from 'gun'
import 'gun/sea'
import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'

// Initialize Gun with localStorage persistence
const gun = Gun({
  localStorage: true,
  radisk: true,
})

// SEA (Security, Encryption, Authorization) utilities
const SEA = Gun.SEA

// Generate new user key pair
export async function generateKeyPair() {
  try {
    const pair = await SEA.pair()
    return pair
  } catch (error) {
    console.error('Key pair generation failed:', error)
    throw error
  }
}

// Authenticate user with existing key pair
export async function authenticateUser(pair) {
  try {
    const user = gun.user()
    await user.auth(pair)
    return user
  } catch (error) {
    console.error('Authentication failed:', error)
    throw error
  }
}

// Create new user account
export async function createUser(username, pair) {
  try {
    const user = gun.user()
    await user.create(username, pair)
    return user
  } catch (error) {
    console.error('User creation failed:', error)
    throw error
  }
}

// Get current authenticated user
export function getCurrentUser() {
  return gun.user().is
}

// Encrypt message for recipient
export async function encryptMessage(message, recipientPubKey) {
  try {
    const encrypted = await SEA.encrypt(message, recipientPubKey)
    return encrypted
  } catch (error) {
    console.error('Encryption failed:', error)
    throw error
  }
}

// Decrypt message with private key
export async function decryptMessage(encryptedMessage, privateKey) {
  try {
    const decrypted = await SEA.decrypt(encryptedMessage, privateKey)
    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    throw error
  }
}

// Sign data with user's private key
export async function signData(data, privateKey) {
  try {
    const signature = await SEA.sign(data, privateKey)
    return signature
  } catch (error) {
    console.error('Signing failed:', error)
    throw error
  }
}

// Verify signature with public key
export async function verifySignature(data, signature, publicKey) {
  try {
    const verified = await SEA.verify(data, publicKey, signature)
    return verified
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

// Store user profile data with ACL
export function storeUserProfile(userId, profileData, userPair) {
  const profileNode = gun.get(`profile/${userId}`)
  
  // Set ACL to only allow owner to write
  profileNode.get('username').put(profileData.username)
  profileNode.get('avatar').put(profileData.avatar)
  profileNode.get('publicKey').put(userId)
  
  return profileNode
}

// Get user profile
export function getUserProfile(userId) {
  return gun.get(`profile/${userId}`)
}

// Create chat room
export function createChatRoom(roomId, roomName, creatorId) {
  const room = gun.get(`rooms/${roomId}`)
  room.put({
    name: roomName,
    creator: creatorId,
    createdAt: Date.now(),
    type: 'public'
  })
  return room
}

// Join chat room
export function joinChatRoom(roomId, userId) {
  const membership = gun.get(`rooms/${roomId}/members/${userId}`)
  membership.put({
    joinedAt: Date.now(),
    userId: userId
  })
}

// Send message to chat room
export function sendMessage(roomId, messageData) {
  const messages = gun.get(`rooms/${roomId}/messages`)
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  messages.get(messageId).put({
    ...messageData,
    timestamp: Date.now(),
    id: messageId
  })
  
  return messageId
}

// Get messages from chat room
export function getMessages(roomId) {
  return gun.get(`rooms/${roomId}/messages`)
}

// Send direct message
export async function sendDirectMessage(recipientId, messageData, senderPair) {
  try {
    // Encrypt message for recipient
    const encryptedContent = await encryptMessage(messageData.content, recipientId)
    
    const dmNode = gun.get(`dm/${senderPair.pub}_${recipientId}`)
    const messageId = `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    dmNode.get(messageId).put({
      ...messageData,
      content: encryptedContent,
      encrypted: true,
      sender: senderPair.pub,
      recipient: recipientId,
      timestamp: Date.now(),
      id: messageId
    })
    
    return messageId
  } catch (error) {
    console.error('Failed to send direct message:', error)
    throw error
  }
}

// Get direct messages
export function getDirectMessages(userId1, userId2) {
  const dmKey = [userId1, userId2].sort().join('_')
  return gun.get(`dm/${dmKey}`)
}

// Add friend
export function addFriend(userId, friendId) {
  const friends = gun.get(`friends/${userId}`)
  friends.get(friendId).put({
    addedAt: Date.now(),
    userId: friendId
  })
}

// Get friends list
export function getFriends(userId) {
  return gun.get(`friends/${userId}`)
}

// Block user
export function blockUser(userId, blockedUserId) {
  const blocked = gun.get(`blocked/${userId}`)
  blocked.get(blockedUserId).put({
    blockedAt: Date.now(),
    userId: blockedUserId
  })
}

// Check if user is blocked
export function isUserBlocked(userId, checkUserId) {
  return gun.get(`blocked/${userId}`).get(checkUserId)
}

// Set online status
export function setOnlineStatus(userId, isOnline) {
  const presence = gun.get('presence')
  presence.get(userId).put({
    online: isOnline,
    lastSeen: isOnline ? null : Date.now()
  })
}

// Get online status
export function getOnlineStatus(userId) {
  return gun.get('presence').get(userId)
}

// Export gun instance and utilities
export { gun, SEA }
export default gun