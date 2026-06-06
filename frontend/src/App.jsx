import { useEffect, useRef, useState } from 'react'
import './App.css'
import Profile from './Profile'
import Settings from './Settings'
import Announcements from './Announcements'
import { socket } from './socket'
import { apiDelete, apiGet, apiPost, apiPut } from './api'

const ACCENT_COLORS = [
  { name: 'Purple', light: '#8b5cf6', dark: '#a78bfa', hover: '#7c3aed', darkHover: '#c4b5fd' },
  { name: 'Blue', light: '#3b82f6', dark: '#60a5fa', hover: '#2563eb', darkHover: '#93bbfd' },
  { name: 'Teal', light: '#14b8a6', dark: '#2dd4bf', hover: '#0d9488', darkHover: '#5eead4' },
  { name: 'Green', light: '#22c55e', dark: '#4ade80', hover: '#16a34a', darkHover: '#86efac' },
  { name: 'Orange', light: '#f97316', dark: '#fb923c', hover: '#ea580c', darkHover: '#fdba74' },
  { name: 'Pink', light: '#ec4899', dark: '#f472b6', hover: '#db2777', darkHover: '#f9a8d4' },
  { name: 'Red', light: '#ef4444', dark: '#f87171', hover: '#dc2626', darkHover: '#fca5a5' },
  { name: 'Amber', light: '#f59e0b', dark: '#fbbf24', hover: '#d97706', darkHover: '#fcd34d' },
]

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

const emptyConversations = {
  DMs: [],
  Classes: [],
  Clubs: [],
}

const emptySelectedConversationIds = {
  DMs: null,
  Classes: null,
  Clubs: null,
}

const emptyAddForm = {
  name: '',
  description: '',
  friendEmail: '',
  inviteCode: '',
}

const messagingTabs = ['DMs', 'Classes', 'Clubs']
const groupTabs = ['Classes', 'Clubs']
const allTabs = ['DMs', 'Classes', 'Clubs', 'Profile', 'Announcements', 'Settings']

function applyAccentVars(theme, accentIndex) {
  const c = ACCENT_COLORS[accentIndex]
  const isDark = theme === 'dark'
  const base = isDark ? c.dark : c.light
  const hover = isDark ? c.darkHover : c.hover
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)

  document.documentElement.style.setProperty('--accent-base', base)
  document.documentElement.style.setProperty('--accent-hover-base', hover)
  document.documentElement.style.setProperty('--accent-subtle-base', `rgba(${r}, ${g}, ${b}, 0.1)`)
  document.documentElement.style.setProperty('--accent-border-base', `rgba(${r}, ${g}, ${b}, 0.4)`)
}

function mapMessage(message) {
  return {
    id: message._id?.toString?.() ?? message._id ?? message.id,
    user: message.senderName ?? message.user ?? 'Unknown',
    senderId: message.senderId?.toString?.() ?? message.senderId ?? '',
    text: message.text ?? '',
    timestamp: message.timestamp ?? new Date().toISOString(),
  }
}

function App({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('DMs')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState(emptyConversations)
  const [messagesByConversation, setMessagesByConversation] = useState({})
  const [selectedConversationIds, setSelectedConversationIds] = useState(emptySelectedConversationIds)
  const [announcementGroups, setAnnouncementGroups] = useState(FALLBACK_ANNOUNCEMENTS)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [sidebarNotice, setSidebarNotice] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addMode, setAddMode] = useState('create')
  const [addForm, setAddForm] = useState(emptyAddForm)
  const [addError, setAddError] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [joinSearchQuery, setJoinSearchQuery] = useState('')
  const [joinSearchResults, setJoinSearchResults] = useState([])
  const [joinSearchLoading, setJoinSearchLoading] = useState(false)
  const [joinSearchMessage, setJoinSearchMessage] = useState('')
  const [isConversationSidebarOpen, setIsConversationSidebarOpen] = useState(false)
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsData, setDetailsData] = useState(null)
  const [detailActionLoading, setDetailActionLoading] = useState(false)
  const [detailInviteEmail, setDetailInviteEmail] = useState('')
  const [detailNotice, setDetailNotice] = useState('')

  const [theme, setTheme] = useState(currentUser?.settings?.theme ?? 'dark')
  const [accentIndex, setAccentIndex] = useState(currentUser?.settings?.accentIndex ?? 0)

  const messagesContainerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const activeTabRef = useRef(activeTab)
  const activeConversationIdRef = useRef(null)
  const isInfoSidebarOpenRef = useRef(isInfoSidebarOpen)
  const currentUserIdRef = useRef(currentUser?.id ?? null)
  const isMessagingTab = messagingTabs.includes(activeTab)
  const isGroupTab = groupTabs.includes(activeTab)
  const categoryConversations = isMessagingTab ? conversations[activeTab] : []
  const filteredConversations = categoryConversations.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const activeConversationId = isMessagingTab
    ? selectedConversationIds[activeTab] ?? categoryConversations[0]?.id ?? null
    : null
  const activeConversation = isMessagingTab
    ? categoryConversations.find((item) => item.id === activeConversationId) ?? categoryConversations[0] ?? null
    : null
  const activeMessages = activeConversation ? messagesByConversation[activeConversation.id] ?? [] : []
  const canSendMessage = Boolean(activeConversation && messageInput.trim())

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    activeConversationIdRef.current = activeConversation?.id ?? null
  }, [activeConversation?.id])

  useEffect(() => {
    isInfoSidebarOpenRef.current = isInfoSidebarOpen
  }, [isInfoSidebarOpen])

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null
  }, [currentUser?.id])

  const buildDetailPath = (category, conversationId, userId) => {
    if (category === 'DMs') {
      return `/friends/${conversationId}?userId=${encodeURIComponent(userId)}`
    }

    if (category === 'Classes') {
      return `/classrooms/${conversationId}?userId=${encodeURIComponent(userId)}`
    }

    return `/clubs/${conversationId}?userId=${encodeURIComponent(userId)}`
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    applyAccentVars(theme, accentIndex)
  }, [theme, accentIndex])

  useEffect(() => {
    if (!currentUser?.id) {
      return
    }

    setConversationLoading(true)
    Promise.all([
      apiGet(`/friends?userId=${encodeURIComponent(currentUser.id)}`),
      apiGet(`/classrooms?userId=${encodeURIComponent(currentUser.id)}`),
      apiGet(`/clubs?userId=${encodeURIComponent(currentUser.id)}`),
    ])
      .then(([friendsData, classroomsData, clubsData]) => {
        const nextConversations = {
          DMs: friendsData.friends ?? [],
          Classes: classroomsData.classrooms ?? [],
          Clubs: clubsData.clubs ?? [],
        }

        setConversations(nextConversations)
        setSelectedConversationIds((prev) => {
          const next = { ...prev }

          messagingTabs.forEach((tab) => {
            const list = nextConversations[tab]
            next[tab] = list.some((item) => item.id === prev[tab]) ? prev[tab] : list[0]?.id ?? null
          })

          return next
        })
      })
      .catch((error) => {
        console.error('Failed to load conversations:', error)
        setSidebarNotice('Could not load conversations from the backend.')
      })
      .finally(() => setConversationLoading(false))
  }, [currentUser?.id])

  useEffect(() => {
    if (activeTab !== 'Announcements') {
      return
    }

    setAnnouncementsLoading(true)
    apiGet('/announcements')
      .then((data) => {
        if (data.groups && data.groups.length > 0) {
          setAnnouncementGroups(data.groups)
        } else {
          setAnnouncementGroups(FALLBACK_ANNOUNCEMENTS)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch announcements:', error)
        setAnnouncementGroups(FALLBACK_ANNOUNCEMENTS)
      })
      .finally(() => setAnnouncementsLoading(false))
  }, [activeTab])

  useEffect(() => {
    if (!activeConversation?.id) {
      return
    }

    let cancelled = false
    setMessagesLoading(true)

    apiGet(`/messages/${activeConversation.id}`)
      .then((messages) => {
        if (cancelled) {
          return
        }

        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: messages.map(mapMessage),
        }))
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to fetch messages:', error)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMessagesLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeConversation?.id])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) {
      return
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [activeConversation?.id, activeMessages.length])

  useEffect(() => {
    socket.connect()

    const handleConnect = () => {
      console.log('Socket connected:', socket.id)

      if (currentUserIdRef.current) {
        socket.emit('register_user', currentUserIdRef.current)
      }
    }

    const handleConnectError = (error) => console.error('Socket error:', error.message ?? error)
    const handleMessageError = (payload) => console.error('Socket message error:', payload?.error ?? payload)

    const handleReceiveMessage = (incoming) => {
      const { conversationId, category } = incoming
      if (!conversationId || !category) {
        return
      }

      const normalized = mapMessage(incoming)

      setMessagesByConversation((prev) => {
        const existingMessages = prev[conversationId] ?? []
        if (existingMessages.some((message) => message.id === normalized.id)) {
          return prev
        }

        return {
          ...prev,
          [conversationId]: [...existingMessages, normalized],
        }
      })

      setConversations((prev) => {
        const group = prev[category]
        if (!group) {
          return prev
        }

        return {
          ...prev,
          [category]: group.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, lastMsg: normalized.text }
              : conversation
          ),
        }
      })
    }

    const handleConversationRemoved = ({ category, conversationId, notice }) => {
      if (!category || !conversationId) {
        return
      }

      removeConversation(category, conversationId, notice || 'Conversation removed.')
    }

    const handleConversationUpserted = ({ category, conversation }) => {
      if (!category || !conversation?.id) {
        return
      }

      upsertConversation(category, conversation, '', { select: false })
    }

    const handleGroupDetailChanged = ({ category, conversationId }) => {
      if (!category || !conversationId) {
        return
      }

      if (
        activeTabRef.current === category &&
        activeConversationIdRef.current === conversationId &&
        isInfoSidebarOpenRef.current
      ) {
        refreshOpenDetail(category, conversationId)
      }
    }

    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('message_error', handleMessageError)
    socket.on('receive_message', handleReceiveMessage)
    socket.on('conversation_removed', handleConversationRemoved)
    socket.on('conversation_upserted', handleConversationUpserted)
    socket.on('group_detail_changed', handleGroupDetailChanged)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('message_error', handleMessageError)
      socket.off('receive_message', handleReceiveMessage)
      socket.off('conversation_removed', handleConversationRemoved)
      socket.off('conversation_upserted', handleConversationUpserted)
      socket.off('group_detail_changed', handleGroupDetailChanged)
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (socket.connected && currentUser?.id) {
      socket.emit('register_user', currentUser.id)
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!isMessagingTab || !activeConversation?.id) {
      return
    }

    const roomPayload = {
      category: activeTab,
      conversationId: activeConversation.id,
    }

    socket.emit('join_room', roomPayload)

    return () => {
      socket.emit('leave_room', roomPayload)
    }
  }, [activeTab, activeConversation?.id, isMessagingTab])

  useEffect(() => {
    if (!isAddModalOpen || !isGroupTab || addMode !== 'join') {
      setJoinSearchResults([])
      setJoinSearchLoading(false)
      setJoinSearchMessage('')
      return
    }

    const trimmedQuery = joinSearchQuery.trim()
    if (trimmedQuery.length < 2) {
      setJoinSearchResults([])
      setJoinSearchMessage(trimmedQuery.length === 0 ? '' : 'Type at least 2 characters to search.')
      return
    }

    let cancelled = false
    setJoinSearchLoading(true)
    setJoinSearchMessage('')

    const basePath = activeTab === 'Classes' ? 'classrooms' : 'clubs'
    apiGet(`/${basePath}/search?userId=${encodeURIComponent(currentUser.id)}&q=${encodeURIComponent(trimmedQuery)}`)
      .then((data) => {
        if (cancelled) {
          return
        }

        const results = activeTab === 'Classes' ? data.classrooms ?? [] : data.clubs ?? []
        setJoinSearchResults(results)
        setJoinSearchMessage(results.length === 0 ? 'No matching results found.' : '')
      })
      .catch((error) => {
        if (!cancelled) {
          setJoinSearchResults([])
          setJoinSearchMessage(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setJoinSearchLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, addMode, currentUser?.id, isAddModalOpen, isGroupTab, joinSearchQuery])

  useEffect(() => {
    if (!isInfoSidebarOpen || !activeConversation?.id || !currentUser?.id) {
      return
    }

    let cancelled = false
    setDetailsLoading(true)
    setDetailsError('')
    setDetailNotice('')

    apiGet(buildDetailPath(activeTab, activeConversation.id, currentUser.id))
      .then((data) => {
        if (cancelled) {
          return
        }

        setDetailsData(data.friend ?? data.classroom ?? data.club ?? null)
      })
      .catch((error) => {
        if (!cancelled) {
          setDetailsData(null)
          setDetailsError(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeConversation?.id, activeTab, currentUser?.id, isInfoSidebarOpen])

  const refreshOpenDetail = async (category, conversationId) => {
    const userId = currentUserIdRef.current
    if (!conversationId || !userId) {
      return
    }

    try {
      const data = await apiGet(buildDetailPath(category, conversationId, userId))
      const detailEntity = data.friend ?? data.classroom ?? data.club ?? null

      setDetailsData(detailEntity)
      setDetailsError('')

      if (detailEntity && category !== 'DMs') {
        syncConversationFromDetail(category, detailEntity)
      }
    } catch (error) {
      console.error('Failed to refresh conversation details:', error)
    }
  }

  const syncConversationFromDetail = (category, detailEntity) => {
    setConversations((prev) => ({
      ...prev,
      [category]: prev[category].map((conversation) =>
        conversation.id === detailEntity.id
          ? {
              ...conversation,
              name: detailEntity.name,
              description: detailEntity.description,
              inviteCode: detailEntity.inviteCode,
              memberCount: detailEntity.members?.length ?? conversation.memberCount,
              isManager: detailEntity.isManager ?? conversation.isManager,
            }
          : conversation
      ),
    }))
  }

  const removeConversation = (category, conversationId, notice) => {
    const isActiveConversationRemoved =
      activeTabRef.current === category && activeConversationIdRef.current === conversationId

    setConversations((prev) => {
      const nextList = prev[category].filter((item) => item.id !== conversationId)

      setSelectedConversationIds((selectedPrev) => ({
        ...selectedPrev,
        [category]:
          selectedPrev[category] === conversationId
            ? nextList[0]?.id ?? null
            : selectedPrev[category],
      }))

      return {
        ...prev,
        [category]: nextList,
      }
    })

    setMessagesByConversation((prev) => {
      const next = { ...prev }
      delete next[conversationId]
      return next
    })

    if (isActiveConversationRemoved) {
      setEditingMessage(null)
      setMessageInput('')
      setIsInfoSidebarOpen(false)
      setDetailsData(null)
      setDetailsError('')
      setDetailNotice('')
    }

    if (notice) {
      setSidebarNotice(notice)
    }
  }

  const setConversationPreview = (category, conversationId, previewText) => {
    setConversations((prev) => ({
      ...prev,
      [category]: prev[category].map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, lastMsg: previewText || 'No messages yet' }
          : conversation
      ),
    }))
  }

  const upsertConversation = (category, conversation, notice, options = {}) => {
    const { select = true } = options

    setConversations((prev) => {
      const existing = prev[category].some((item) => item.id === conversation.id)
      return {
        ...prev,
        [category]: existing
          ? prev[category].map((item) => (item.id === conversation.id ? { ...item, ...conversation } : item))
          : [conversation, ...prev[category]],
      }
    })

    if (select) {
      setSelectedConversationIds((prev) => ({
        ...prev,
        [category]: conversation.id,
      }))
    }

    setMessagesByConversation((prev) => ({
      ...prev,
      [conversation.id]: prev[conversation.id] ?? [],
    }))

    if (notice) {
      setSidebarNotice(notice)
    }
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setAddError('')
    setAddSubmitting(false)
    setAddForm(emptyAddForm)
    setJoinSearchQuery('')
    setJoinSearchResults([])
    setJoinSearchMessage('')
  }

  const openAddModal = () => {
    setAddMode(activeTab === 'DMs' ? 'add' : 'create')
    setAddError('')
    setAddForm(emptyAddForm)
    setJoinSearchQuery('')
    setJoinSearchResults([])
    setJoinSearchMessage('')
    setIsAddModalOpen(true)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchQuery('')
    setMessageInput('')
    setEditingMessage(null)
    setSidebarNotice('')
    setIsConversationSidebarOpen(false)
    setIsInfoSidebarOpen(false)
    setDetailsData(null)
    setDetailsError('')
    setDetailNotice('')
  }

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationIds((prev) => ({
      ...prev,
      [activeTab]: conversationId,
    }))
    setIsConversationSidebarOpen(false)
    setMessageInput('')
    setEditingMessage(null)
  }

  const handleJoinSearchResult = async (result) => {
    setAddSubmitting(true)
    setAddError('')

    try {
      if (activeTab === 'Classes') {
        const data = await apiPost(`/classrooms/${result.id}/join`, {
          userId: currentUser.id,
        })

        upsertConversation('Classes', data.classroom, data.message || `Joined classroom: ${result.name}`)
      } else {
        const data = await apiPost(`/clubs/${result.id}/join`, {
          userId: currentUser.id,
        })

        upsertConversation('Clubs', data.club, data.message || `Joined club: ${result.name}`)
      }

      closeAddModal()
    } catch (error) {
      setAddError(error.message)
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleAddSubmit = async (event) => {
    event.preventDefault()
    setAddSubmitting(true)
    setAddError('')

    try {
      if (activeTab === 'DMs') {
        const data = await apiPost('/friends', {
          userId: currentUser.id,
          friendEmail: addForm.friendEmail,
        })

        upsertConversation('DMs', data.friend, `Friend added: ${data.friend.name}`)
      } else if (activeTab === 'Classes') {
        if (addMode === 'create') {
          const data = await apiPost('/classrooms', {
            ownerId: currentUser.id,
            name: addForm.name,
            description: addForm.description,
          })

          upsertConversation(
            'Classes',
            data.classroom,
            `Classroom created. Invite code: ${data.classroom.inviteCode}`
          )
        } else {
          const data = await apiPost('/classrooms/join', {
            userId: currentUser.id,
            inviteCode: addForm.inviteCode,
          })

          upsertConversation('Classes', data.classroom, data.message || `Joined classroom: ${data.classroom.name}`)
        }
      } else if (activeTab === 'Clubs') {
        if (addMode === 'create') {
          const data = await apiPost('/clubs', {
            ownerId: currentUser.id,
            name: addForm.name,
            description: addForm.description,
          })

          upsertConversation('Clubs', data.club, `Club created. Invite code: ${data.club.inviteCode}`)
        } else {
          const data = await apiPost('/clubs/join', {
            userId: currentUser.id,
            inviteCode: addForm.inviteCode,
          })

          upsertConversation('Clubs', data.club, data.message || `Joined club: ${data.club.name}`)
        }
      }

      closeAddModal()
    } catch (error) {
      setAddError(error.message)
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!activeConversation || messageInput.trim() === '') {
      return
    }

    const text = messageInput.trim()
    setMessageInput('')
    setSidebarNotice('')

    try {
      const data = await apiPost('/messages', {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        senderName: currentUser.username,
        category: activeTab,
        text,
      })

      const newMessage = mapMessage(data.message)

      setMessagesByConversation((prev) => {
        const nextMessages = [...(prev[activeConversation.id] ?? []), newMessage]
        return {
          ...prev,
          [activeConversation.id]: nextMessages,
        }
      })

      setConversationPreview(activeTab, activeConversation.id, newMessage.text)

      socket.emit('send_message', {
        ...newMessage,
        category: activeTab,
        conversationId: activeConversation.id,
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      setSidebarNotice(`Could not send message: ${error.message}`)
      setMessageInput(text)
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

  const handleSaveEdit = async () => {
    if (!activeConversation || !editingMessage) {
      return
    }

    const trimmedText = editingMessage.text.trim()
    if (!trimmedText) {
      return
    }

    try {
      await apiPut(`/messages/${editingMessage.messageId}`, { text: trimmedText })

      setMessagesByConversation((prev) => {
        const nextMessages = (prev[activeConversation.id] ?? []).map((message) =>
          message.id === editingMessage.messageId
            ? { ...message, text: trimmedText }
            : message
        )

        return {
          ...prev,
          [activeConversation.id]: nextMessages,
        }
      })

      setConversationPreview(activeTab, activeConversation.id, trimmedText)
      setEditingMessage(null)
    } catch (error) {
      console.error('Failed to edit message:', error)
      setSidebarNotice(`Could not edit message: ${error.message}`)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!activeConversation) {
      return
    }

    try {
      await apiDelete(`/messages/${messageId}`)

      setMessagesByConversation((prev) => {
        const nextMessages = (prev[activeConversation.id] ?? []).filter((message) => message.id !== messageId)
        const nextPreview = nextMessages.at(-1)?.text ?? 'No messages yet'

        setConversationPreview(activeTab, activeConversation.id, nextPreview)

        return {
          ...prev,
          [activeConversation.id]: nextMessages,
        }
      })

      if (editingMessage?.messageId === messageId) {
        setEditingMessage(null)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      setSidebarNotice(`Could not delete message: ${error.message}`)
    }
  }

  const runGroupDetailAction = async (request, successMessage) => {
    setDetailActionLoading(true)
    setDetailsError('')
    setDetailNotice('')

    try {
      const data = await request()
      const detailEntity = data.classroom ?? data.club
      setDetailsData(detailEntity)
      syncConversationFromDetail(activeTab, detailEntity)
      setDetailNotice(data.message || successMessage)
    } catch (error) {
      setDetailsError(error.message)
    } finally {
      setDetailActionLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!activeConversation) {
      return
    }

    const confirmed = window.confirm(`Remove ${activeConversation.name} from your friends list?`)
    if (!confirmed) {
      return
    }

    setDetailActionLoading(true)
    try {
      const data = await apiDelete(`/friends/${activeConversation.id}?userId=${encodeURIComponent(currentUser.id)}`)
      removeConversation('DMs', activeConversation.id, data.message || `Removed friend: ${activeConversation.name}`)
      setIsInfoSidebarOpen(false)
      setDetailsData(null)
    } catch (error) {
      setDetailsError(error.message)
    } finally {
      setDetailActionLoading(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!activeConversation) {
      return
    }

    const label = activeTab === 'Classes' ? 'classroom' : 'club'
    const confirmed = window.confirm(`Delete this ${label}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    setDetailActionLoading(true)
    try {
      const basePath = activeTab === 'Classes' ? 'classrooms' : 'clubs'
      const data = await apiDelete(`/${basePath}/${activeConversation.id}?managerId=${encodeURIComponent(currentUser.id)}`)
      removeConversation(activeTab, activeConversation.id, data.message || `${label} deleted successfully`)
      setIsInfoSidebarOpen(false)
      setDetailsData(null)
    } catch (error) {
      setDetailsError(error.message)
    } finally {
      setDetailActionLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!activeConversation) {
      return
    }

    const label = activeTab === 'Classes' ? 'classroom' : 'club'
    const confirmed = window.confirm(`Leave this ${label}?`)
    if (!confirmed) {
      return
    }

    setDetailActionLoading(true)
    try {
      const basePath = activeTab === 'Classes' ? 'classrooms' : 'clubs'
      const data = await apiPost(`/${basePath}/${activeConversation.id}/leave`, {
        userId: currentUser.id,
      })

      removeConversation(activeTab, activeConversation.id, data.message || `You left ${label}: ${activeConversation.name}`)
      setIsInfoSidebarOpen(false)
      setDetailsData(null)
    } catch (error) {
      setDetailsError(error.message)
    } finally {
      setDetailActionLoading(false)
    }
  }

  const handlePromoteMember = async (member) => {
    if (!activeConversation) {
      return
    }

    const basePath = activeTab === 'Classes' ? 'classrooms' : 'clubs'
    await runGroupDetailAction(
      () =>
        apiPost(`/${basePath}/${activeConversation.id}/managers`, {
          managerId: currentUser.id,
          memberId: member.id,
        }),
      `${member.name} promoted to manager`
    )
  }

  const handleRemoveMember = async (member) => {
    if (!activeConversation) {
      return
    }

    const label = activeTab === 'Classes' ? 'classroom' : 'club'
    const confirmed = window.confirm(`Remove ${member.name} from this ${label}?`)
    if (!confirmed) {
      return
    }

    const basePath = activeTab === 'Classes' ? 'classrooms' : 'clubs'
    await runGroupDetailAction(
      () =>
        apiDelete(
          `/${basePath}/${activeConversation.id}/members/${member.id}?managerId=${encodeURIComponent(currentUser.id)}`
        ),
      `${member.name} removed`
    )
  }

  const handleInviteMemberByEmail = async (event) => {
    event.preventDefault()
    if (!activeConversation || !detailInviteEmail.trim()) {
      return
    }

    const basePath = activeTab === 'Classes' ? 'classrooms' : 'clubs'
    await runGroupDetailAction(
      () =>
        apiPost(`/${basePath}/${activeConversation.id}/members`, {
          managerId: currentUser.id,
          email: detailInviteEmail.trim(),
        }),
      'Member added successfully'
    )
    setDetailInviteEmail('')
  }

  const renderChatHeader = () => {
    if (!activeConversation) {
      return activeTab
    }

    const prefix = activeTab === 'DMs' ? '' : '# '
    return `${prefix}${activeConversation.name}`
  }

  const renderAddModalTitle = () => {
    if (activeTab === 'DMs') {
      return 'Add Friend'
    }

    return addMode === 'create'
      ? `Create ${activeTab === 'Classes' ? 'Classroom' : 'Club'}`
      : `Join ${activeTab === 'Classes' ? 'Classroom' : 'Club'}`
  }

  const renderDetailSidebar = () => {
    if (!isInfoSidebarOpen) {
      return null
    }

    return (
      <aside className="detail-sidebar">
        <div className="detail-sidebar-header">
          <h3>{activeTab === 'DMs' ? 'Friend Info' : `${activeTab.slice(0, -1)} Info`}</h3>
          <button type="button" aria-label="Close information sidebar" onClick={() => setIsInfoSidebarOpen(false)}>
            Close
          </button>
        </div>

        {detailsLoading ? (
          <p className="empty-list-state">Loading details…</p>
        ) : detailsError ? (
          <p className="detail-error">{detailsError}</p>
        ) : !detailsData ? (
          <p className="empty-list-state">No details available.</p>
        ) : activeTab === 'DMs' ? (
          <div className="detail-content">
            <div className="detail-block">
              <h4>Name</h4>
              <p>{detailsData.name}</p>
            </div>

            <div className="detail-block">
              <h4>Email</h4>
              <p>{detailsData.email}</p>
            </div>

            <div className="detail-block">
              <h4>Bio</h4>
              <p>{detailsData.profile?.bio || 'No bio yet.'}</p>
            </div>

            <div className="detail-block">
              <h4>Position</h4>
              <p>{detailsData.profile?.position || 'Not set'}</p>
            </div>

            <div className="detail-block">
              <h4>Department</h4>
              <p>{detailsData.profile?.department || 'Not set'}</p>
            </div>

            <div className="detail-block">
              <h4>Graduation Year</h4>
              <p>{detailsData.profile?.graduationYear || 'Not set'}</p>
            </div>

            <div className="detail-actions-row">
              <button type="button" onClick={handleRemoveFriend} disabled={detailActionLoading}>
                {detailActionLoading ? 'Removing…' : 'Remove Friend'}
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-content">
            <div className="detail-block">
              <h4>Name</h4>
              <p>{detailsData.name}</p>
            </div>

            <div className="detail-block">
              <h4>Description</h4>
              <p>{detailsData.description || 'No description provided.'}</p>
            </div>

            <div className="detail-block">
              <h4>Invitation Code</h4>
              <p>{detailsData.inviteCode}</p>
            </div>

            <div className="detail-block">
              <h4>Members</h4>
              <div className="detail-members-list">
                {detailsData.members.map((member) => (
                  <div key={member.id} className="detail-member-card">
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.email}</p>
                      <p>{member.isManager ? 'Manager' : 'Member'}</p>
                    </div>

                    {detailsData.isManager && member.id !== currentUser.id && (
                      <div className="detail-member-actions">
                        {!member.isManager && (
                          <button type="button" onClick={() => handlePromoteMember(member)} disabled={detailActionLoading}>
                            Promote
                          </button>
                        )}
                        <button type="button" onClick={() => handleRemoveMember(member)} disabled={detailActionLoading}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {detailsData.isManager && (
              <>
                <form className="detail-invite-form" onSubmit={handleInviteMemberByEmail}>
                  <label className="detail-field">
                    <span>Add Member By Email</span>
                    <input
                      type="email"
                      value={detailInviteEmail}
                      onChange={(event) => setDetailInviteEmail(event.target.value)}
                      placeholder="student@school.edu"
                    />
                  </label>
                  <button type="submit" disabled={detailActionLoading}>
                    {detailActionLoading ? 'Saving…' : 'Add Member'}
                  </button>
                </form>

                <div className="detail-actions-row">
                  <button type="button" onClick={handleDeleteGroup} disabled={detailActionLoading}>
                    {detailActionLoading ? 'Deleting…' : `Delete ${activeTab === 'Classes' ? 'Classroom' : 'Club'}`}
                  </button>
                </div>
              </>
            )}

            {!detailsData.isManager && (
              <div className="detail-actions-row">
                <button type="button" onClick={handleLeaveGroup} disabled={detailActionLoading}>
                  {detailActionLoading ? 'Leaving…' : `Leave ${activeTab === 'Classes' ? 'Classroom' : 'Club'}`}
                </button>
              </div>
            )}

            {detailNotice && <p className="detail-success">{detailNotice}</p>}
          </div>
        )}
      </aside>
    )
  }

  return (
    <div
      className={`app-container ${
        ['Profile', 'Announcements', 'Settings'].includes(activeTab) ? 'non-messaging-mode' : ''
      }`}
    >
      <nav className="nav-sidebar">
        <div className="nav-mobile-select">
          <label className="nav-mobile-select-label" htmlFor="tab-select">
            Current Tab
          </label>
          <select
            id="tab-select"
            value={activeTab}
            aria-label="Choose app section"
            onChange={(event) => handleTabChange(event.target.value)}
          >
            {allTabs.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        </div>

        <div className="nav-button-list">
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
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </nav>

      {isMessagingTab && (
        <aside className={`list-sidebar ${isConversationSidebarOpen ? 'list-sidebar-open' : ''}`}>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label={`Search ${activeTab}`}
            />
            <button type="button" aria-label={`Add to ${activeTab}`} onClick={openAddModal}>+</button>
          </div>

          {sidebarNotice && <p className="sidebar-notice">{sidebarNotice}</p>}

          <div className="chat-list">
            {conversationLoading ? (
              <p className="empty-list-state">Loading conversations…</p>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chat-item ${item.id === activeConversation?.id ? 'chat-item-active' : ''}`}
                  onClick={() => handleSelectConversation(item.id)}
                >
                  <strong>{activeTab === 'DMs' ? item.name : `# ${item.name}`}</strong>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>{item.lastMsg}</p>
                </button>
              ))
            ) : (
              <p className="empty-list-state">
                {searchQuery ? 'No matching conversations.' : 'No conversations yet. Use + to add one.'}
              </p>
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
          <div className={`chat-layout ${isInfoSidebarOpen ? 'chat-layout-with-sidebar' : ''}`}>
            <section className="chat-main-panel">
              <header className="chat-header">
                <h2 className="chat-header-text">{renderChatHeader()}</h2>
                <div className="chat-header-actions">
                  {isMessagingTab && (
                    <button
                      type="button"
                      className="chat-list-button"
                      aria-label={isConversationSidebarOpen ? 'Hide conversations' : 'Show conversations'}
                      onClick={() => {
                        setIsInfoSidebarOpen(false)
                        setIsConversationSidebarOpen((prev) => !prev)
                      }}
                    >
                      {isConversationSidebarOpen ? 'Hide Chats' : 'Chats'}
                    </button>
                  )}
                  {activeConversation && (
                    <button
                      type="button"
                      className="chat-info-button"
                      aria-label={isInfoSidebarOpen ? 'Hide information sidebar' : 'Show information sidebar'}
                      onClick={() => {
                        setIsConversationSidebarOpen(false)
                        setIsInfoSidebarOpen((prev) => !prev)
                      }}
                    >
                      {isInfoSidebarOpen ? 'Hide Info' : 'Show Info'}
                    </button>
                  )}
                </div>
              </header>

              <div className="messages" ref={messagesContainerRef}>
                {messagesLoading ? (
                  <p className="empty-list-state">Loading messages…</p>
                ) : activeConversation ? (
                  activeMessages.length > 0 ? (
                    activeMessages.map((msg) => {
                      const isEditing =
                        editingMessage?.conversationId === activeConversation.id &&
                        editingMessage?.messageId === msg.id
                      const isOwn = msg.senderId === currentUser?.id || msg.user === currentUser?.username

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
                                  onChange={(event) =>
                                    setEditingMessage((prev) =>
                                      prev ? { ...prev, text: event.target.value } : prev
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

                            {isOwn && (
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
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="empty-list-state">No messages yet. Start the conversation below.</p>
                  )
                ) : (
                  <p className="empty-list-state">Select a conversation from the left sidebar.</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="input-area">
                <div className="input-row">
                  <input
                    type="text"
                    placeholder={activeConversation ? 'Message…' : 'Select a conversation first'}
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSendMessage()
                      }
                    }}
                    aria-label="Message input"
                    disabled={!activeConversation}
                  />
                  <button type="button" className="send-button" onClick={handleSendMessage} disabled={!canSendMessage}>
                    Send
                  </button>
                </div>
              </div>
            </section>

            {renderDetailSidebar()}
          </div>
        )}
      </main>

      {isMessagingTab && isConversationSidebarOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close open sidebar"
          onClick={() => {
            setIsConversationSidebarOpen(false)
            setIsInfoSidebarOpen(false)
          }}
        />
      )}

      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={closeAddModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{renderAddModalTitle()}</h3>
            </div>

            {(activeTab === 'Classes' || activeTab === 'Clubs') && (
              <div className="modal-toggle-row">
                <button
                  type="button"
                  className={addMode === 'create' ? 'modal-toggle-active' : ''}
                  onClick={() => setAddMode('create')}
                >
                  Create New
                </button>
                <button
                  type="button"
                  className={addMode === 'join' ? 'modal-toggle-active' : ''}
                  onClick={() => setAddMode('join')}
                >
                  Join Existing
                </button>
              </div>
            )}

            <form className="modal-form" onSubmit={handleAddSubmit}>
              {activeTab === 'DMs' ? (
                <label className="modal-field">
                  <span>Friend Email</span>
                  <input
                    type="email"
                    value={addForm.friendEmail}
                    onChange={(event) => setAddForm((prev) => ({ ...prev, friendEmail: event.target.value }))}
                    placeholder="friend@school.edu"
                    required
                  />
                </label>
              ) : addMode === 'create' ? (
                <>
                  <label className="modal-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder={activeTab === 'Classes' ? 'INF 124' : 'VGDC'}
                      required
                    />
                  </label>

                  <label className="modal-field">
                    <span>Description</span>
                    <textarea
                      value={addForm.description}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="Optional details"
                      rows={4}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="modal-field">
                    <span>Invite Code</span>
                    <input
                      type="text"
                      value={addForm.inviteCode}
                      onChange={(event) => setAddForm((prev) => ({ ...prev, inviteCode: event.target.value }))}
                      placeholder={activeTab === 'Classes' ? 'CLASS-ABC123' : 'CLUB-ABC123'}
                    />
                  </label>

                  <label className="modal-field">
                    <span>Search Existing {activeTab === 'Classes' ? 'Classes' : 'Clubs'}</span>
                    <input
                      type="text"
                      value={joinSearchQuery}
                      onChange={(event) => setJoinSearchQuery(event.target.value)}
                      placeholder={activeTab === 'Classes' ? 'Search by classroom name' : 'Search by club name'}
                    />
                  </label>

                  <div className="join-search-results">
                    {joinSearchLoading ? (
                      <p className="empty-list-state">Searching…</p>
                    ) : joinSearchResults.length > 0 ? (
                      joinSearchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="join-search-result"
                          onClick={() => handleJoinSearchResult(result)}
                          disabled={addSubmitting}
                        >
                          <strong>{result.name}</strong>
                          <p>{result.description || 'No description provided.'}</p>
                        </button>
                      ))
                    ) : joinSearchMessage ? (
                      <p className="empty-list-state">{joinSearchMessage}</p>
                    ) : null}
                  </div>
                </>
              )}

              {addError && <p className="modal-error">{addError}</p>}

              <div className="modal-actions">
                <button type="button" onClick={closeAddModal}>Cancel</button>
                <button type="submit" disabled={addSubmitting}>
                  {addSubmitting ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App