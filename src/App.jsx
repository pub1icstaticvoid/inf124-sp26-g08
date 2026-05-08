import { useEffect, useRef, useState } from 'react'
import './App.css'
import Profile from './Profile'
import Settings from './Settings'
import Announcements from './Announcements'

const initialConversations = {
  DMs: [
    { id: 'dm-friend-a', name: 'Friend A', lastMsg: 'Want to study after class?' },
    { id: 'dm-friend-b', name: 'Friend B', lastMsg: 'I sent over the notes.' },
  ],
  Classes: [
    { id: 'class-inf124', name: 'INF 124', lastMsg: 'Assignment 2 is due Friday.' },
    { id: 'class-ics31', name: 'ICS 31', lastMsg: 'Lab office hours moved to 4 PM.' },
  ],
  Clubs: [
    { id: 'club-chess', name: 'Chess Club', lastMsg: 'Tournament bracket is up.' },
    { id: 'club-vgdc', name: 'VGDC', lastMsg: 'Pitch deck feedback is posted.' },
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

const announcementGroups = [
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
        body: 'Bring the newest deck and vertical slice notes to Thursday’s meeting.',
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

const messagingTabs = ['DMs', 'Classes', 'Clubs']

function App({ onLogout }) {
  const [activeTab, setActiveTab] = useState('DMs')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState('dark')
  const [conversations, setConversations] = useState(initialConversations)
  const [messagesByConversation, setMessagesByConversation] = useState(initialMessagesByConversation)
  const [selectedConversationIds, setSelectedConversationIds] = useState({
    DMs: initialConversations.DMs[0].id,
    Classes: initialConversations.Classes[0].id,
    Clubs: initialConversations.Clubs[0].id,
  })
  const [editingMessage, setEditingMessage] = useState(null)

  const messagesEndRef = useRef(null)
  const isMessagingTab = messagingTabs.includes(activeTab)
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.id, activeMessages.length])

  const updateConversationPreview = (category, conversationId, nextMessages) => {
    setConversations((prev) => ({
      ...prev,
      [category]: prev[category].map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMsg: nextMessages.length > 0 ? nextMessages[nextMessages.length - 1].text : 'No messages yet',
            }
          : conversation
      ),
    }))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchQuery('')
    setMessageInput('')
    setEditingMessage(null)
  }

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationIds((prev) => ({
      ...prev,
      [activeTab]: conversationId,
    }))
    setMessageInput('')
    setEditingMessage(null)
  }

  const handleSendMessage = () => {
    if (!activeConversation || messageInput.trim() === '') {
      return
    }

    const newMessage = {
      id: Date.now(),
      user: 'You',
      text: messageInput.trim(),
    }

    setMessagesByConversation((prev) => {
      const nextMessages = [...(prev[activeConversation.id] ?? []), newMessage]
      updateConversationPreview(activeTab, activeConversation.id, nextMessages)

      return {
        ...prev,
        [activeConversation.id]: nextMessages,
      }
    })

    setMessageInput('')
  }

  const handleDeleteMessage = (messageId) => {
    if (!activeConversation) {
      return
    }

    setMessagesByConversation((prev) => {
      const nextMessages = (prev[activeConversation.id] ?? []).filter((message) => message.id !== messageId)
      updateConversationPreview(activeTab, activeConversation.id, nextMessages)

      return {
        ...prev,
        [activeConversation.id]: nextMessages,
      }
    })

    if (editingMessage?.messageId === messageId) {
      setEditingMessage(null)
    }
  }

  const handleStartEdit = (message) => {
    if (!activeConversation) {
      return
    }

    setEditingMessage({
      conversationId: activeConversation.id,
      messageId: message.id,
      text: message.text,
    })
  }

  const handleSaveEdit = () => {
    if (!activeConversation || !editingMessage) {
      return
    }

    const trimmedText = editingMessage.text.trim()
    if (trimmedText === '') {
      return
    }

    setMessagesByConversation((prev) => {
      const nextMessages = (prev[activeConversation.id] ?? []).map((message) =>
        message.id === editingMessage.messageId ? { ...message, text: trimmedText } : message
      )
      updateConversationPreview(activeTab, activeConversation.id, nextMessages)

      return {
        ...prev,
        [activeConversation.id]: nextMessages,
      }
    })

    setEditingMessage(null)
  }

  const renderChatHeader = () => {
    if (!activeConversation) {
      return null
    }

    const prefix = activeTab === 'DMs' ? '' : '# '
    return `${prefix}${activeConversation.name}`
  }

  return (
    <div
      className={`app-container ${
        activeTab === 'Profile' || activeTab === 'Announcements' || activeTab === 'Settings'
          ? 'non-messaging-mode'
          : ''
      }`}
    >
      <nav className="nav-sidebar">
        <button type="button" onClick={() => handleTabChange('DMs')}>
          DMs
        </button>
        <button type="button" onClick={() => handleTabChange('Classes')}>
          Classes
        </button>
        <button type="button" onClick={() => handleTabChange('Clubs')}>
          Clubs
        </button>
        <button type="button" onClick={() => handleTabChange('Profile')}>
          Profile
        </button>
        <button type="button" onClick={() => handleTabChange('Announcements')}>
          Announcements
        </button>
        <button type="button" onClick={() => handleTabChange('Settings')}>
          Settings
        </button>

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
              onChange={(event) => setSearchQuery(event.target.value)}
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
                <p style={{ fontSize: '12px' }}>{item.lastMsg}</p>
              </button>
            ))}

            {filteredConversations.length === 0 && <p className="empty-list-state">No matching conversations.</p>}
          </div>
        </aside>
      )}

      <main className="chat-window">
        {activeTab === 'Profile' ? (
          <Profile />
        ) : activeTab === 'Announcements' ? (
          <Announcements groups={announcementGroups} />
        ) : activeTab === 'Settings' ? (
          <Settings theme={theme} setTheme={setTheme} />
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

                return (
                  <div key={msg.id} className="message-bubble">
                    <div className="message-row">
                      <div className="message-content">
                        <span className={`${msg.user === 'You' ? 'my-message' : 'text-recipient'}`}>
                          {msg.user}:{' '}
                        </span>

                        {isEditing ? (
                          <input
                            type="text"
                            className="message-edit-input"
                            value={editingMessage.text}
                            onChange={(event) =>
                              setEditingMessage((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      text: event.target.value,
                                    }
                                  : prev
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleSaveEdit()
                              }
                            }}
                          />
                        ) : (
                          <span className="text-message">{msg.text}</span>
                        )}
                      </div>

                      <div className="message-actions">
                        {isEditing ? (
                          <>
                            <button type="button" onClick={handleSaveEdit}>
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingMessage(null)}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleStartEdit(msg)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDeleteMessage(msg.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="input-area">
              <input
                type="text"
                placeholder="Message..."
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSendMessage()
                  }
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
