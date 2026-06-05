import { useEffect, useRef, useState } from 'react'
import './App.css'
import Profile from './Profile'
import Settings from './Settings'
import Announcements from './Announcements'
import { socket } from "./socket"
import { apiGet, apiPost, apiPut, apiDelete } from "./api"

const ACCENT_COLORS = [
  { name: 'Purple', light: '#8b5cf6', dark: '#a78bfa', hover: '#7c3aed', darkHover: '#c4b5fd' },
  { name: 'Blue',   light: '#3b82f6', dark: '#60a5fa', hover: '#2563eb', darkHover: '#93bbfd' },
  { name: 'Teal',   light: '#14b8a6', dark: '#2dd4bf', hover: '#0d9488', darkHover: '#5eead4' },
  { name: 'Green',  light: '#22c55e', dark: '#4ade80', hover: '#16a34a', darkHover: '#86efac' },
  { name: 'Orange', light: '#f97316', dark: '#fb923c', hover: '#ea580c', darkHover: '#fdba74' },
  { name: 'Pink',   light: '#ec4899', dark: '#f472b6', hover: '#db2777', darkHover: '#f9a8d4' },
  { name: 'Red',    light: '#ef4444', dark: '#f87171', hover: '#dc2626', darkHover: '#fca5a5' },
  { name: 'Amber',  light: '#f59e0b', dark: '#fbbf24', hover: '#d97706', darkHover: '#fcd34d' },
]

// Shown when the DB has no announcements yet or the backend is unreachable
const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 'ann-inf124',
    label: 'INF 124',
    announcements: [
      {
        id: 'inf124-1',
        title: 'Assignment 2',
        body: 'Submit the prototype and peer review form before Friday at 11:59 PM.',
      },
      {
        id: 'inf124-2',
        title: 'Discussion Section',
        body: 'This week we are reviewing chat interface usability patterns and message states.',
      },
    ],
  },
  {
    id: 'ann-ics31',
    label: 'ICS 31',
    announcements: [
      {
        id: 'ics31-1',
        title: 'Lab Update',
        body: 'Office hours move to 4 PM in DBH 4011 because of the review session.',
      },
    ],
  },
  {
    id: 'ann-vgdc',
    label: 'VGDC',
    announcements: [
      {
        id: 'vgdc-1',
        title: 'Pitch Review',
        body: "Bring the newest deck and vertical slice notes to Thursday's meeting.",
      },
      {
        id: 'vgdc-2',
        title: 'Art Sync',
        body: 'Character concept feedback closes tonight so the team can lock sprint tasks.',
      },
      {
        id: 'vgdc-3',
        title: 'Playtest Signups',
        body: 'Volunteer slots are open for the Saturday showcase build playtest.',
      },
    ],
  },
]

// Conversations are hardcoded until it exists in db
// Once you do, replace these string ids with real MongoDB ObjectIds so the messages API works.
const initialConversations = {
  DMs: [
    { id: 'dm-friend-a', name: 'Friend A', lastMsg: 'Want to study after class?' },
    { id: 'dm-friend-b', name: 'Friend B', lastMsg: 'I sent over the notes.' },
  ],
  Classes: [
    { id: 'class-inf124', name: 'INF 124', lastMsg: 'Assignment 2 is due Friday.' },
    { id: 'class-ics31',  name: 'ICS 31',  lastMsg: 'Lab office hours moved to 4 PM.' },
  ],
  Clubs: [
    { id: 'club-chess', name: 'Chess Club', lastMsg: 'Tournament bracket is up.' },
    { id: 'club-vgdc',  name: 'VGDC',       lastMsg: 'Pitch deck feedback is posted.' },
  ],
}

const initialMessagesByConversation = {
  'dm-friend-a': [
    { id: 101, user: 'Friend A', text: 'Want to study after class?' },
    { id: 102, user: 'You', text: 'Yeah, I can meet at the library around 3.' },
  ],
  'dm-friend-b': [
    { id: 103, user: 'Friend B', text: 'I sent over the notes.' },
    { id: 104, user: 'You', text: 'Perfect, thank you.' },
  ],
  'class-inf124': [
    { id: 105, user: 'TA', text: 'Assignment 2 is due Friday.' },
    { id: 106, user: 'You', text: 'Thanks for the reminder.' },
  ],
  'class-ics31': [
    { id: 107, user: 'Instructor', text: 'Lab office hours moved to 4 PM.' },
    { id: 108, user: 'Student', text: 'Will the recording be posted too?' },
  ],
  'club-chess': [
    { id: 109, user: 'President', text: 'Tournament bracket is up.' },
    { id: 110, user: 'You', text: 'I saw it, good luck everyone.' },
  ],
  'club-vgdc': [
    { id: 111, user: 'Lead', text: 'Pitch deck feedback is posted.' },
    { id: 112, user: 'Designer', text: 'I added the updated mockups in the drive.' },
  ],
}

const messagingTabs = ['DMs', 'Classes', 'Clubs']
const allTabs       = ['DMs', 'Classes', 'Clubs', 'Profile', 'Announcements', 'Settings']

function applyAccentVars(theme, accentIndex) {
  const c      = ACCENT_COLORS[accentIndex]
  const isDark = theme === 'dark'
  const base   = isDark ? c.dark      : c.light
  const hover  = isDark ? c.darkHover : c.hover
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)

  document.documentElement.style.setProperty('--accent-base',        base)
  document.documentElement.style.setProperty('--accent-hover-base',  hover)
  document.documentElement.style.setProperty('--accent-subtle-base', `rgba(${r}, ${g}, ${b}, 0.1)`)
  document.documentElement.style.setProperty('--accent-border-base', `rgba(${r}, ${g}, ${b}, 0.4)`)
}

function App({ currentUser, onLogout }) {
  const [activeTab,        setActiveTab]        = useState('DMs')
  const [messageInput,     setMessageInput]     = useState('')
  const [searchQuery,      setSearchQuery]      = useState('')
  const [conversations,    setConversations]    = useState(initialConversations)
  // Change when actual messages in DB
  const [messagesByConversation, setMessagesByConversation] = useState(initialMessagesByConversation)
  const [selectedConversationIds, setSelectedConversationIds] = useState({
    DMs:     initialConversations.DMs[0].id,
    Classes: initialConversations.Classes[0].id,
    Clubs:   initialConversations.Clubs[0].id,
  })
  const [announcementGroups, setAnnouncementGroups] = useState(FALLBACK_ANNOUNCEMENTS)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)

  const [theme,       setTheme]       = useState(currentUser?.settings?.theme       ?? 'dark')
  const [accentIndex, setAccentIndex] = useState(currentUser?.settings?.accentIndex ?? 0)

  const messagesEndRef        = useRef(null)
  const isMessagingTab        = messagingTabs.includes(activeTab)
  const categoryConversations = isMessagingTab ? conversations[activeTab] : []
  const filteredConversations = categoryConversations.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const activeConversationId = isMessagingTab
    ? selectedConversationIds[activeTab] ?? categoryConversations[0]?.id
    : null
  const activeConversation = isMessagingTab
    ? categoryConversations.find((item) => item.id === activeConversationId) ?? categoryConversations[0]
    : null
  const activeMessages = activeConversation ? messagesByConversation[activeConversation.id] ?? [] : []

  // Apply theme / accent CSS vars whenever they change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    applyAccentVars(theme, accentIndex)
  }, [theme, accentIndex])

  // Fetch announcements from the API when that tab is opened.
  // Falls back to FALLBACK_ANNOUNCEMENTS if the DB is empty or the backend is unreachable.
  useEffect(() => {
    if (activeTab !== 'Announcements') return

    setAnnouncementsLoading(true)
    apiGet('/announcements')
      .then((data) => {
        if (data.groups && data.groups.length > 0) {
          setAnnouncementGroups(data.groups)
        } else {
          // DB returned nothing — keep showing the fallback data
          setAnnouncementGroups(FALLBACK_ANNOUNCEMENTS)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch announcements:', err)
        // Backend unreachable — keep showing the fallback data
        setAnnouncementGroups(FALLBACK_ANNOUNCEMENTS)
      })
      .finally(() => setAnnouncementsLoading(false))
  }, [activeTab])

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  // Socket setup
  useEffect(() => {
    socket.connect()

    const handleConnect      = () => console.log('Socket connected:', socket.id)
    const handleConnectError = (error) => console.error('Socket error:', error.message ?? error)

    const handleReceiveMessage = (incoming) => {
      const { conversationId, category } = incoming
      if (!conversationId || !category) return

      setMessagesByConversation((prev) => {
        const existing = prev[conversationId] ?? []
        // Deduplicate so our own sent message isn't added twice
        if (existing.some((m) => m.id === incoming.id)) return prev
        return { ...prev, [conversationId]: [...existing, incoming] }
      })

      setConversations((prev) => {
        const group = prev[category]
        if (!group) return prev
        return {
          ...prev,
          [category]: group.map((c) =>
            c.id === conversationId ? { ...c, lastMsg: incoming.text } : c
          ),
        }
      })
    }

    socket.on('connect',        handleConnect)
    socket.on('connect_error',  handleConnectError)
    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('connect',        handleConnect)
      socket.off('connect_error',  handleConnectError)
      socket.off('receive_message', handleReceiveMessage)
      socket.disconnect()
    }
  }, [])

  const updateConversationPreview = (category, conversationId, nextMessages) => {
    setConversations((prev) => ({
      ...prev,
      [category]: prev[category].map((c) =>
        c.id === conversationId
          ? { ...c, lastMsg: nextMessages.at(-1)?.text ?? 'No messages yet' }
          : c
      ),
    }))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchQuery('')
    setMessageInput('')
    setEditingMessage(null)
  }

  // Fetch messages from the DB when a conversation is selected.
  // Gracefully skips if the conversation id isn't a real MongoDB ObjectId yet.
  const handleSelectConversation = async (conversationId) => {
    setSelectedConversationIds((prev) => ({ ...prev, [activeTab]: conversationId }))
    setMessageInput('')
    setEditingMessage(null)

    try {
      const messages  = await apiGet(`/messages/${conversationId}`)
      const formatted = messages.map((m) => ({
        id:       m._id,
        user:     m.senderName,
        senderId: m.senderId,
        text:     m.text,
      }))
      setMessagesByConversation((prev) => ({ ...prev, [conversationId]: formatted }))
    } catch (err) {
      console.warn('Could not fetch messages from DB:', err.message)
    }
  }

  // POST to MongoDB first, then broadcast via socket.
  // Falls back to socket-only while conversation ids are still placeholder strings.
  const handleSendMessage = async () => {
    if (!activeConversation || messageInput.trim() === '') return

    const text = messageInput.trim()
    setMessageInput('')

    try {
      const data = await apiPost('/messages', {
        conversationId: activeConversation.id,
        senderId:       currentUser.id,
        senderName:     currentUser.username,
        text,
      })

      const newMessage = {
        id:       data.message._id,
        user:     currentUser.username,
        senderId: currentUser.id,
        text,
      }

      setMessagesByConversation((prev) => {
        const next = [...(prev[activeConversation.id] ?? []), newMessage]
        updateConversationPreview(activeTab, activeConversation.id, next)
        return { ...prev, [activeConversation.id]: next }
      })

      socket.emit('send_message', {
        id:             data.message._id,
        user:           currentUser.username,
        senderId:       currentUser.id,
        text,
        category:       activeTab,
        conversationId: activeConversation.id,
      })
    } catch (err) {
      // Conversation id isn't a real ObjectId yet — use socket only
      console.warn('DB save failed, falling back to socket-only:', err.message)
      socket.emit('send_message', {
        id:             Date.now(),
        user:           currentUser?.username ?? 'You',
        text,
        category:       activeTab,
        conversationId: activeConversation.id,
      })
    }
  }

  const handleSaveEdit = async () => {
    if (!activeConversation || !editingMessage) return
    const trimmedText = editingMessage.text.trim()
    if (!trimmedText) return

    try {
      await apiPut(`/messages/${editingMessage.messageId}`, { text: trimmedText })
    } catch (err) {
      console.warn('Could not persist edit to DB:', err.message)
    }

    setMessagesByConversation((prev) => {
      const next = (prev[activeConversation.id] ?? []).map((m) =>
        m.id === editingMessage.messageId ? { ...m, text: trimmedText } : m
      )
      updateConversationPreview(activeTab, activeConversation.id, next)
      return { ...prev, [activeConversation.id]: next }
    })
    setEditingMessage(null)
  }

  const handleDeleteMessage = async (messageId) => {
    if (!activeConversation) return

    try {
      await apiDelete(`/messages/${messageId}`)
    } catch (err) {
      console.warn('Could not persist delete to DB:', err.message)
    }

    setMessagesByConversation((prev) => {
      const next = (prev[activeConversation.id] ?? []).filter((m) => m.id !== messageId)
      updateConversationPreview(activeTab, activeConversation.id, next)
      return { ...prev, [activeConversation.id]: next }
    })

    if (editingMessage?.messageId === messageId) setEditingMessage(null)
  }

  const handleStartEdit = (message) => {
    if (!activeConversation) return
    setEditingMessage({
      conversationId: activeConversation.id,
      messageId:      message.id,
      text:           message.text,
    })
  }

  const renderChatHeader = () => {
    if (!activeConversation) return null
    const prefix = activeTab === 'DMs' ? '' : '# '
    return `${prefix}${activeConversation.name}`
  }

  const isOwnMessage = (msg) =>
    msg.senderId === currentUser?.id || msg.user === currentUser?.username

  return (
    <div
      className={`app-container ${
        ['Profile', 'Announcements', 'Settings'].includes(activeTab) ? 'non-messaging-mode' : ''
      }`}
    >
      <nav className="nav-sidebar">
        {allTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'nav-active' : ''}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </nav>

      {isMessagingTab && (
        <aside className="list-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button">+</button>
          </div>

          <div className="chat-list">
            {filteredConversations.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chat-item ${item.id === activeConversation?.id ? 'chat-item-active' : ''}`}
                onClick={() => handleSelectConversation(item.id)}
              >
                <strong>{activeTab === 'DMs' ? item.name : `# ${item.name}`}</strong>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>{item.lastMsg}</p>
              </button>
            ))}
            {filteredConversations.length === 0 && (
              <p className="empty-list-state">No matching conversations.</p>
            )}
          </div>
        </aside>
      )}

      <main className="chat-window">
        {activeTab === 'Profile' ? (
          <Profile currentUser={currentUser} />
        ) : activeTab === 'Announcements' ? (
          announcementsLoading
            ? <p style={{ padding: 24, color: 'var(--text)' }}>Loading…</p>
            : <Announcements groups={announcementGroups} />
        ) : activeTab === 'Settings' ? (
          <Settings
            theme={theme}
            setTheme={setTheme}
            accentIndex={accentIndex}
            setAccentIndex={setAccentIndex}
          />
        ) : (
          <>
            <header className="chat-header">
              <h2 className="chat-header-text">{renderChatHeader()}</h2>
            </header>

            <div className="messages">
              {activeMessages.map((msg) => {
                const isEditing =
                  editingMessage?.conversationId === activeConversation?.id &&
                  editingMessage?.messageId === msg.id
                const isOwn = isOwnMessage(msg)

                return (
                  <div key={msg.id} className={`message-bubble ${isOwn ? 'message-bubble-own' : ''}`}>
                    <div className="message-row">
                      <div className="message-content">
                        <span className={isOwn ? 'my-message' : 'text-recipient'}>
                          {msg.user}:{' '}
                        </span>

                        {isEditing ? (
                          <input
                            type="text"
                            className="message-edit-input"
                            value={editingMessage.text}
                            onChange={(e) =>
                              setEditingMessage((prev) =>
                                prev ? { ...prev, text: e.target.value } : prev
                              )
                            }
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit() }}
                          />
                        ) : (
                          <span className="text-message">{msg.text}</span>
                        )}
                      </div>

                      <div className="message-actions">
                        {isEditing ? (
                          <>
                            <button type="button" onClick={handleSaveEdit}>Save</button>
                            <button type="button" onClick={() => setEditingMessage(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleStartEdit(msg)}>Edit</button>
                            <button type="button" onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <input
                type="text"
                placeholder="Message…"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App