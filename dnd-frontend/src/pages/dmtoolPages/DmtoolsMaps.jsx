import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState
} from 'reactflow'
import 'reactflow/dist/style.css'
import '../../assets/styles/Dmtools.css'
import '../../assets/styles/DmtoolsMaps.css'

// ===== Backend config =====
const API_BASE = 'https://api.dnd-tool.com' // <-- backend base url
const NODE_TYPES = ['Location', 'NPC', 'Faction', 'Quest', 'Lore', 'Character(PC)', 'Item', 'Monster']

const createId = () => `node-${Date.now()}-${Math.floor(Math.random() * 10000)}`

// --- URL helper (backend relative /uploads -> abs) ---
const toAbsUrl = (url) => {
  if (!url) return ''
  if (typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url}`
}

// ===== Minimal fetch helper (JWT + better errors) =====
async function api(path, options = {}) {
  const token = localStorage.getItem('token') // <-- ha nalad mas nev, itt ird at

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  })

  const text = await res.text()
  const data = text
    ? (() => {
        try {
          return JSON.parse(text)
        } catch {
          return text
        }
      })()
    : null

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized (401). Jelentkezz be ujra, vagy hianyzik a token.')
    }

    const msg =
      (data && (data.message || data.Message)) ||
      (typeof data === 'string' ? data : null) ||
      `Request failed: ${res.status}`
    throw new Error(msg)
  }

  return data
}

// ===== Upload helper (multipart/form-data + JWT) =====
async function apiUpload(path, file) {
  const token = localStorage.getItem('token')

  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
      // IMPORTANT: Do NOT set Content-Type for FormData
    },
    body: form
  })

  const text = await res.text()
  const data = text
    ? (() => {
        try {
          return JSON.parse(text)
        } catch {
          return text
        }
      })()
    : null

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized (401). Jelentkezz be ujra, vagy hianyzik a token.')
    }

    const msg =
      (data && (data.message || data.Message)) ||
      (typeof data === 'string' ? data : null) ||
      `Upload failed: ${res.status}`
    throw new Error(msg)
  }

  return data
}

export default function DmtoolsMaps() {
  // ===== Backend state =====
  const [campaigns, setCampaigns] = useState([])
  const [activeCampaignId, setActiveCampaignId] = useState(null)
  const [campaignName, setCampaignName] = useState('')
  const [createName, setCreateName] = useState('')
  const [existingId, setExistingId] = useState('')

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const [edgeLabelDraft, setEdgeLabelDraft] = useState('')
  const [edgeEditorPos, setEdgeEditorPos] = useState({ x: 0, y: 0 })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveQueued, setSaveQueued] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const [lightboxUrl, setLightboxUrl] = useState('')
  const [toasts, setToasts] = useState([])
  const [coverDragging, setCoverDragging] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [contextMenu, setContextMenu] = useState(null)
  const [paneMenu, setPaneMenu] = useState(null)
  const [layoutMode, setLayoutMode] = useState('tree-vertical')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUsername, setShareUsername] = useState('')
  const [shareRole, setShareRole] = useState('viewer')
  const [shareList, setShareList] = useState([])
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')

  // Debounce autosave
  const saveTimerRef = useRef(null)
  const hydratedRef = useRef(false)
  const mapLayoutRef = useRef(null)
  const searchInputRef = useRef(null)
  const lastToastRef = useRef(0)
  const lastSavedHashRef = useRef('')
  const contextImageInputRef = useRef(null)
  const contextImageNodeIdRef = useRef(null)
  const reactFlowInstanceRef = useRef(null)
  const initialFitDoneRef = useRef(false)
  const lastTreePositionsRef = useRef(new Map())

  const pushToast = useCallback((type, message) => {
    const now = Date.now()
    if (now - lastToastRef.current < 900 && type === 'success') return
    lastToastRef.current = now
    const id = `toast-${now}-${Math.floor(Math.random() * 10000)}`
    setToasts((prev) => [...prev, { id, type, message, leaving: false }])
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
      )
    }, 2600)
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const computeHash = useCallback((value) => {
    const raw = JSON.stringify(value)
    let hash = 0
    for (let i = 0; i < raw.length; i += 1) {
      hash = (hash << 5) - hash + raw.charCodeAt(i)
      hash |= 0
    }
    return String(hash)
  }, [])

  // ===== Load campaign list =====
  const refreshCampaigns = useCallback(async () => {
    const list = await api('/api/mapforge/campaigns')
    setCampaigns(
      Array.isArray(list)
        ? list.map((campaign) => ({
            ...campaign,
            accessRole: campaign?.accessRole || 'owner',
            isOwner: campaign?.isOwner ?? true
          }))
        : []
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setErrorMsg('')
        const list = await api('/api/mapforge/campaigns')
        if (!cancelled) {
          setCampaigns(
            Array.isArray(list)
              ? list.map((campaign) => ({
                  ...campaign,
                  accessRole: campaign?.accessRole || 'owner',
                  isOwner: campaign?.isOwner ?? true
                }))
              : []
          )
        }
      } catch (e) {
        if (!cancelled) setErrorMsg(e.message || 'Failed to load campaigns')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ===== Load active campaign =====
  useEffect(() => {
    if (!activeCampaignId) return

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setErrorMsg('')
        hydratedRef.current = false

        const campaign = await api(`/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}`)

        if (cancelled) return

        setCampaignName(campaign?.name || '')
        if (campaign?.accessRole) {
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === campaign.id
                ? { ...c, accessRole: campaign.accessRole, isOwner: campaign.isOwner ?? c.isOwner }
                : c
            )
          )
        }

        // ensure data shape for backend (imageUrl/statblock exist)
        const normalizedNodes = (campaign?.nodes || []).map((n) => ({
          ...n,
          data: {
            label: n?.data?.label ?? 'New Node',
            type: n?.data?.type ?? 'Location',
            tags: Array.isArray(n?.data?.tags) ? n.data.tags : [],
            notes: n?.data?.notes ?? '',
            imageUrl: n?.data?.imageUrl ?? null,
            statblock: n?.data?.statblock ?? null
          }
        }))

        setNodes(normalizedNodes)
        setEdges(campaign?.edges || [])
        setSelectedNodeId(null)
        setSelectedEdgeId(null)
        setSearch('')
        setTypeFilter('all')
        setTagFilter('')

        lastSavedHashRef.current = computeHash({
          name: campaign?.name || '',
          nodes: normalizedNodes,
          edges: campaign?.edges || []
        })
        setIsDirty(false)
        setSaveQueued(false)
        hydratedRef.current = true
        initialFitDoneRef.current = false
      } catch (e) {
        if (!cancelled) setErrorMsg(e.message || 'Failed to load campaign')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeCampaignId, setEdges, setNodes, computeHash])

  // ===== Autosave (debounced) =====
  useEffect(() => {
    if (!activeCampaignId) return
    if (!hydratedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveQueued(true)

    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaveQueued(false)
        setSaving(true)
        setErrorMsg('')

        const payload = {
          name: (campaignName || 'Untitled').trim(),
          nodes,
          edges
        }

        const updated = await api(`/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })

        // update list row (backend returns coverImageUrl too; keep it)
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === updated.id
              ? {
                  ...c,
                  name: updated.name,
                  updatedAt: updated.updatedAt,
                  coverImageUrl: updated.coverImageUrl ?? c.coverImageUrl,
                  accessRole: updated.accessRole ?? c.accessRole,
                  isOwner: updated.isOwner ?? c.isOwner
                }
              : c
          )
        )
        lastSavedHashRef.current = computeHash({
          name: updated.name || payload.name,
          nodes,
          edges
        })
        setIsDirty(false)
        pushToast('success', 'Saved')
      } catch (e) {
        setErrorMsg(e.message || 'Save failed')
        pushToast('error', e.message || 'Save failed')
      } finally {
        setSaving(false)
      }
    }, 600)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [nodes, edges, campaignName, activeCampaignId, pushToast, computeHash])

  useEffect(() => {
    if (!hydratedRef.current) return
    const currentHash = computeHash({ name: campaignName, nodes, edges })
    setIsDirty(currentHash !== lastSavedHashRef.current)
  }, [campaignName, nodes, edges, computeHash])

  const activeCampaign = useMemo(
    () => campaigns.find((item) => item.id === activeCampaignId) || null,
    [campaigns, activeCampaignId]
  )
  const accessRole = activeCampaign?.accessRole || 'owner'
  const isOwner = accessRole === 'owner'
  const canEdit = accessRole === 'owner' || accessRole === 'editor'
  const canDeleteNodes = accessRole === 'owner'
  const ensureCanEdit = useCallback(() => {
    if (canEdit) return true
    pushToast('error', 'Read-only access')
    return false
  }, [canEdit, pushToast])
  const ensureCanDeleteNodes = useCallback(() => {
    if (canDeleteNodes) return true
    pushToast('error', 'Only the owner can delete nodes')
    return false
  }, [canDeleteNodes, pushToast])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  )

  const visibleNodes = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    const tagValue = tagFilter.trim().toLowerCase()

    return nodes.map((node) => {
      const label = (node.data?.label || '').toLowerCase()
      const tags = (node.data?.tags || []).map((tag) => String(tag).toLowerCase())
      const type = (node.data?.type || '').toLowerCase()

      const matchesSearch = !searchValue || label.includes(searchValue)
      const matchesType = typeFilter === 'all' || type === typeFilter.toLowerCase()
      const matchesTag = !tagValue || tags.some((tag) => tag.includes(tagValue))

      const isSelected = node.id === selectedNodeId
      return {
        ...node,
        hidden: !(matchesSearch && matchesType && matchesTag),
        className: isSelected ? 'dmtools-node dmtools-node-selected' : 'dmtools-node'
      }
    })
  }, [nodes, search, typeFilter, tagFilter, selectedNodeId])

  const visibleEdges = useMemo(() => {
    const visibility = new Map(visibleNodes.map((node) => [node.id, !node.hidden]))
    return edges.map((edge) => ({
      ...edge,
      hidden: !(visibility.get(edge.source) && visibility.get(edge.target))
    }))
  }, [edges, visibleNodes])

  const matchedNodes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return nodes.filter((node) => {
      const label = String(node.data?.label || '').toLowerCase()
      const type = String(node.data?.type || '').toLowerCase()
      const tags = (node.data?.tags || []).map((tag) => String(tag).toLowerCase())
      const notes = String(node.data?.notes || '').toLowerCase()
      return (
        label.includes(query) ||
        type.includes(query) ||
        notes.includes(query) ||
        tags.some((tag) => tag.includes(query))
      )
    })
  }, [nodes, search])

  const handleCreateCampaign = useCallback(async () => {
    const trimmed = createName.trim()
    if (!trimmed) return

    try {
      setLoading(true)
      setErrorMsg('')

      const created = await api('/api/mapforge/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed, seedStarter: true })
      })

      await refreshCampaigns()

      setCreateName('')
      setExistingId('')
      setActiveCampaignId(created.id)
      pushToast('success', 'Campaign created')
    } catch (e) {
      setErrorMsg(e.message || 'Create failed')
      pushToast('error', e.message || 'Create failed')
    } finally {
      setLoading(false)
    }
  }, [createName, refreshCampaigns, pushToast])

  const handleOpenExisting = useCallback(() => {
    if (!existingId) return
    setActiveCampaignId(existingId)
  }, [existingId])

  const handleBackToChooser = useCallback(async () => {
    setActiveCampaignId(null)
    hydratedRef.current = false

    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setContextMenu(null)
    setCampaignName('')
    setSearch('')
    setTypeFilter('all')
    setTagFilter('')
    setShareOpen(false)
    setShareUsername('')
    setShareRole('viewer')
    setShareList([])
    setShareError('')
    setShareLoading(false)

    try {
      await refreshCampaigns()
    } catch {
      // ignore
    }
  }, [refreshCampaigns, setEdges, setNodes])

  const loadShares = useCallback(async () => {
    if (!activeCampaignId || !isOwner) return
    try {
      setShareLoading(true)
      setShareError('')
      const list = await api(
        `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/shares`
      )
      setShareList(Array.isArray(list) ? list : [])
    } catch (e) {
      setShareError(e.message || 'Failed to load shares')
      pushToast('error', e.message || 'Failed to load shares')
    } finally {
      setShareLoading(false)
    }
  }, [activeCampaignId, isOwner, pushToast])

  const handleShareInvite = useCallback(async () => {
    if (!activeCampaignId || !isOwner) return
    const username = shareUsername.trim()
    if (!username) return

    try {
      setShareLoading(true)
      setShareError('')
      const created = await api(`/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/shares`, {
        method: 'POST',
        body: JSON.stringify({ username, role: shareRole })
      })
      setShareList((prev) => {
        const next = Array.isArray(prev) ? [...prev] : []
        const index = next.findIndex((item) => item.userId === created.userId)
        if (index >= 0) {
          next[index] = created
        } else {
          next.push(created)
        }
        return next.sort((a, b) => String(a.username).localeCompare(String(b.username)))
      })
      setShareUsername('')
      pushToast('success', 'Share updated')
    } catch (e) {
      setShareError(e.message || 'Share failed')
      pushToast('error', e.message || 'Share failed')
    } finally {
      setShareLoading(false)
    }
  }, [activeCampaignId, isOwner, pushToast, shareRole, shareUsername])

  const handleUpdateShareRole = useCallback(
    async (userId, role) => {
      if (!activeCampaignId || !isOwner) return
      try {
        setShareLoading(true)
        setShareError('')
        const updated = await api(
          `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/shares/${userId}`,
          {
            method: 'PUT',
            body: JSON.stringify({ role })
          }
        )
        setShareList((prev) =>
          prev.map((item) => (item.userId === updated.userId ? updated : item))
        )
        pushToast('success', 'Role updated')
      } catch (e) {
        setShareError(e.message || 'Update failed')
        pushToast('error', e.message || 'Update failed')
      } finally {
        setShareLoading(false)
      }
    },
    [activeCampaignId, isOwner, pushToast]
  )

  const handleRemoveShare = useCallback(
    async (userId) => {
      if (!activeCampaignId || !isOwner) return
      try {
        setShareLoading(true)
        setShareError('')
        await api(
          `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/shares/${userId}`,
          { method: 'DELETE' }
        )
        setShareList((prev) => prev.filter((item) => item.userId !== userId))
        pushToast('success', 'Share removed')
      } catch (e) {
        setShareError(e.message || 'Remove failed')
        pushToast('error', e.message || 'Remove failed')
      } finally {
        setShareLoading(false)
      }
    },
    [activeCampaignId, isOwner, pushToast]
  )

  const handleAddNode = useCallback(() => {
    if (!ensureCanEdit()) return
    const newNode = {
      id: createId(),
      position: { x: Math.random() * 400 - 200, y: Math.random() * 300 - 150 },
      data: {
        label: 'New Node',
        type: 'Location',
        tags: [],
        notes: '',
        imageUrl: null,
        statblock: null
      }
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(newNode.id)
    setDrawerOpen(true)
  }, [ensureCanEdit, setNodes])

  const handleCreateNodeAt = useCallback(
    (position) => {
      if (!ensureCanEdit()) return
      const newNode = {
        id: createId(),
        position,
        data: {
          label: 'New Node',
          type: 'Location',
          tags: [],
          notes: '',
          imageUrl: null,
          statblock: null
        }
      }
      setNodes((prev) => [...prev, newNode])
    },
    [ensureCanEdit, setNodes]
  )

  const handleConnect = useCallback((params) => {
    if (!ensureCanEdit()) return
    setEdges((prev) => addEdge({ ...params, type: 'smoothstep' }, prev))
  }, [ensureCanEdit, setEdges])

  const handleNodesChange = useCallback(
    (changes) => {
      if (!canEdit) return
      onNodesChange(changes)
    },
    [canEdit, onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes) => {
      if (!canEdit) return
      onEdgesChange(changes)
    },
    [canEdit, onEdgesChange]
  )

  const updateNodeData = useCallback((nodeId, updates) => {
    if (!ensureCanEdit()) return
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      )
    )
  }, [ensureCanEdit, setNodes])

  const handleDeleteNode = useCallback(() => {
    if (!ensureCanDeleteNodes()) return
    if (!selectedNodeId) return
    setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId))
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    )
    setSelectedNodeId(null)
    setDrawerOpen(false)
  }, [ensureCanDeleteNodes, selectedNodeId, setEdges, setNodes])

  const handleDuplicateNode = useCallback(() => {
    if (!ensureCanEdit()) return
    if (!selectedNode) return
    const clonedId = createId()
    const clonedNode = {
      ...selectedNode,
      id: clonedId,
      position: {
        x: (selectedNode.position?.x || 0) + 40,
        y: (selectedNode.position?.y || 0) + 40
      },
      data: {
        ...selectedNode.data,
        label: `${selectedNode.data?.label || 'Node'} Copy`
      }
    }
    setNodes((prev) => [...prev, clonedNode])
    setSelectedNodeId(clonedId)
    setDrawerOpen(true)
  }, [ensureCanEdit, selectedNode, setNodes])

  const handleAutoLayout = useCallback(() => {
    if (!ensureCanEdit()) return
    if (!nodes.length) return

    const idToNode = new Map(nodes.map((node) => [node.id, node]))
    const indegree = new Map()
    const outdegree = new Map()
    const adjacency = new Map()

    nodes.forEach((node) => {
      indegree.set(node.id, 0)
      outdegree.set(node.id, 0)
      adjacency.set(node.id, [])
    })

    edges.forEach((edge) => {
      if (!idToNode.has(edge.source) || !idToNode.has(edge.target)) return
      indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1)
      outdegree.set(edge.source, (outdegree.get(edge.source) || 0) + 1)
      adjacency.get(edge.source)?.push(edge.target)
    })

    const pickRoot = () => {
      if (selectedNodeId && idToNode.has(selectedNodeId)) return selectedNodeId
      let best = nodes[0]?.id
      let bestOut = -1
      nodes.forEach((node) => {
        const out = outdegree.get(node.id) || 0
        if (out > bestOut) {
          bestOut = out
          best = node.id
        }
      })
      if (best) return best
      return nodes[0]?.id
    }

    const rootId = pickRoot()
    const isHorizontal = layoutMode === 'tree-horizontal'
    const isCompact = layoutMode === 'tree-compact'
    const spacingX = isCompact ? 170 : 230
    const spacingY = isCompact ? 140 : 200
    const gapBetweenTrees = isCompact ? 220 : 320

    const buildTree = (startId) => {
      const parent = new Map()
      const children = new Map()
      nodes.forEach((node) => children.set(node.id, []))

      const queue = [startId]
      parent.set(startId, null)

      while (queue.length) {
        const currentId = queue.shift()
        const rawChildren = adjacency.get(currentId) || []
        const sortedChildren = [...rawChildren].sort((a, b) => {
          const labelA = (idToNode.get(a)?.data?.label || a).toLowerCase()
          const labelB = (idToNode.get(b)?.data?.label || b).toLowerCase()
          return labelA.localeCompare(labelB)
        })

        sortedChildren.forEach((childId) => {
          if (parent.has(childId)) return
          parent.set(childId, currentId)
          children.get(currentId)?.push(childId)
          queue.push(childId)
        })
      }

      return { parent, children }
    }

    const computeSubtreeWidth = (nodeId, children, widthMap) => {
      const kids = children.get(nodeId) || []
      if (!kids.length) {
        widthMap.set(nodeId, 1)
        return 1
      }
      let total = 0
      kids.forEach((childId) => {
        total += computeSubtreeWidth(childId, children, widthMap)
      })
      widthMap.set(nodeId, Math.max(1, total))
      return widthMap.get(nodeId)
    }

    const assignPositions = (nodeId, children, widthMap, positions, depth, xStart) => {
      const kids = children.get(nodeId) || []
      const nodeWidth = widthMap.get(nodeId) || 1
      let cursor = xStart
      kids.forEach((childId) => {
        const childWidth = widthMap.get(childId) || 1
        assignPositions(childId, children, widthMap, positions, depth + 1, cursor)
        cursor += childWidth
      })
      const center = kids.length ? (xStart + nodeWidth / 2) : xStart + 0.5
      positions.set(nodeId, { x: center, y: depth })
    }

    const layoutComponent = (startId, xOffset) => {
      const { parent, children } = buildTree(startId)
      const widthMap = new Map()
      computeSubtreeWidth(startId, children, widthMap)
      const positions = new Map()
      assignPositions(startId, children, widthMap, positions, 0, 0)
      const componentWidth = widthMap.get(startId) || 1
      return { positions, componentWidth, parent }
    }

    const allVisited = new Set()
    const components = []

    if (rootId) {
      const rootComponent = layoutComponent(rootId, 0)
      rootComponent.positions.forEach((_, nodeId) => allVisited.add(nodeId))
      components.push(rootComponent)
    }

    const remaining = nodes.filter((node) => !allVisited.has(node.id))
    if (remaining.length) {
      const remainingIds = new Set(remaining.map((node) => node.id))
      const remainingIndegree = new Map()
      remaining.forEach((node) => remainingIndegree.set(node.id, 0))
      edges.forEach((edge) => {
        if (remainingIds.has(edge.source) && remainingIds.has(edge.target)) {
          remainingIndegree.set(edge.target, (remainingIndegree.get(edge.target) || 0) + 1)
        }
      })

      const remainingRoots = remaining.filter((node) => (remainingIndegree.get(node.id) || 0) === 0)
      const orderedRemainingRoots = remainingRoots.length ? remainingRoots : remaining
      orderedRemainingRoots.forEach((node) => {
        if (allVisited.has(node.id)) return
        const component = layoutComponent(node.id, 0)
        component.positions.forEach((_, nodeId) => allVisited.add(nodeId))
        components.push(component)
      })
    }

    let offset = 0
    const nodePositions = new Map()
    components.forEach((component) => {
      const width = component.componentWidth || 1
      component.positions.forEach((pos, nodeId) => {
        nodePositions.set(nodeId, { x: pos.x + offset, y: pos.y })
      })
      offset += width + gapBetweenTrees / spacingX
    })

    setNodes((prev) =>
      prev.map((node) => {
        const pos = nodePositions.get(node.id) || { x: 0, y: 0 }
        const x = pos.x * spacingX
        const y = pos.y * spacingY
        return {
          ...node,
          position: isHorizontal ? { x: y, y: x } : { x, y }
        }
      })
    )

    const rootLabel = idToNode.get(rootId)?.data?.label || 'Root'
    const label =
      layoutMode === 'tree-horizontal'
        ? 'Tree layout (left to right)'
        : layoutMode === 'tree-compact'
        ? 'Tree layout (compact)'
        : 'Tree layout (top down)'
    pushToast('success', `${label} from ${rootLabel}`)
  }, [edges, ensureCanEdit, layoutMode, nodes, pushToast, selectedNodeId, setNodes])

  // ===== Campaign cover upload =====
  const handleUploadCover = useCallback(async (file) => {
    if (!canEdit) {
      pushToast('error', 'Read-only access')
      return
    }
    if (!file || !activeCampaignId) return

    try {
      setLoading(true)
      setErrorMsg('')

      const out = await apiUpload(
        `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/cover`,
        file
      )

      const coverImageUrl = out?.coverImageUrl
      if (coverImageUrl) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === activeCampaignId ? { ...c, coverImageUrl } : c))
        )
        pushToast('success', 'Cover updated')
      }
    } catch (e) {
      setErrorMsg(e.message || 'Cover upload failed')
      pushToast('error', e.message || 'Cover upload failed')
    } finally {
      setLoading(false)
    }
  }, [activeCampaignId, canEdit, pushToast])

  // ===== Node image upload/remove =====
  const uploadNodeImage = useCallback(
    async (nodeId, file) => {
      if (!canEdit) {
        pushToast('error', 'Read-only access')
        return
      }
      if (!file || !activeCampaignId || !nodeId) return

      try {
        setLoading(true)
        setErrorMsg('')

        const out = await apiUpload(
          `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/nodes/${encodeURIComponent(
            nodeId
          )}/image`,
          file
        )

        const imageUrl = out?.imageUrl
        if (imageUrl) {
          updateNodeData(nodeId, { imageUrl })
          pushToast('success', 'Image uploaded')
        }
      } catch (e) {
        setErrorMsg(e.message || 'Node image upload failed')
        pushToast('error', e.message || 'Node image upload failed')
      } finally {
        setLoading(false)
      }
    },
    [activeCampaignId, canEdit, updateNodeData, pushToast]
  )

  const handleUploadNodeImage = useCallback(
    async (file) => {
      if (!selectedNode) return
      await uploadNodeImage(selectedNode.id, file)
    },
    [selectedNode, uploadNodeImage]
  )

  const handleRemoveNodeImage = useCallback(async () => {
    if (!canEdit) {
      pushToast('error', 'Read-only access')
      return
    }
    if (!activeCampaignId || !selectedNode) return

    try {
      setLoading(true)
      setErrorMsg('')

      await api(
        `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/nodes/${encodeURIComponent(
          selectedNode.id
        )}/image`,
        { method: 'DELETE' }
      )

      updateNodeData(selectedNode.id, { imageUrl: null })
      pushToast('success', 'Image removed')
    } catch (e) {
      setErrorMsg(e.message || 'Remove image failed')
      pushToast('error', e.message || 'Remove image failed')
    } finally {
      setLoading(false)
    }
  }, [activeCampaignId, canEdit, selectedNode, updateNodeData, pushToast])

  const handleInsertNpcDraft = useCallback(() => {
    if (!ensureCanEdit()) return
    if (!selectedNode) return
    const draft = localStorage.getItem('npcNotesDraft') || ''
    if (!draft.trim()) {
      pushToast('error', 'No NPC draft found yet')
      return
    }
    const existing = selectedNode.data?.notes || ''
    const combined = existing ? `${existing}\n\n${draft}` : draft
    updateNodeData(selectedNode.id, { notes: combined })
    pushToast('success', 'NPC draft inserted')
  }, [ensureCanEdit, selectedNode, updateNodeData, pushToast])

  const handleEdgeLabelCommit = useCallback(() => {
    if (!ensureCanEdit()) return
    if (!selectedEdgeId) return
    const nextLabel = edgeLabelDraft.trim()
    setEdges((prev) =>
      prev.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              label: nextLabel,
              labelStyle: { fill: 'var(--app-text, #f5f5f5)', fontSize: 12 },
              labelBgPadding: [8, 4],
              labelBgStyle: { fill: 'var(--app-panel, rgba(0,0,0,0.6))' }
            }
          : edge
      )
    )
  }, [edgeLabelDraft, ensureCanEdit, selectedEdgeId, setEdges])

  const handleContextMenuAction = useCallback(
    (action) => {
      if (!contextMenu?.nodeId) return
      const nodeId = contextMenu.nodeId
      if (action === 'open') {
        setSelectedNodeId(nodeId)
        setDrawerOpen(true)
      }
      if (action === 'duplicate') {
        if (!ensureCanEdit()) return
        const targetNode = nodes.find((node) => node.id === nodeId)
        if (!targetNode) return
        const clonedId = createId()
        const clonedNode = {
          ...targetNode,
          id: clonedId,
          position: {
            x: (targetNode.position?.x || 0) + 40,
            y: (targetNode.position?.y || 0) + 40
          },
          data: {
            ...targetNode.data,
            label: `${targetNode.data?.label || 'Node'} Copy`
          }
        }
        setNodes((prev) => [...prev, clonedNode])
        setSelectedNodeId(clonedId)
        setDrawerOpen(true)
      }
      if (action === 'delete') {
        if (!ensureCanDeleteNodes()) return
        if (window.confirm('Delete this node?')) {
          setNodes((prev) => prev.filter((node) => node.id !== nodeId))
          setEdges((prev) => prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
          if (selectedNodeId === nodeId) {
            setSelectedNodeId(null)
            setDrawerOpen(false)
          }
        }
      }
      if (action === 'set-image') {
        if (!ensureCanEdit()) return
        contextImageNodeIdRef.current = nodeId
        contextImageInputRef.current?.click()
      }
      setContextMenu(null)
    },
    [contextMenu, ensureCanDeleteNodes, ensureCanEdit, nodes, setEdges, setNodes, selectedNodeId]
  )

  useEffect(() => {
    if (!drawerOpen) return
    if (!selectedNodeId) setDrawerOpen(false)
  }, [drawerOpen, selectedNodeId])

  useEffect(() => {
    if (!shareOpen) return
    loadShares()
  }, [shareOpen, loadShares])

  useEffect(() => {
    if (!reactFlowInstanceRef.current) return
    if (!nodes.length) return
    if (initialFitDoneRef.current) return
    reactFlowInstanceRef.current.fitView({ padding: 0.2, duration: 400 })
    initialFitDoneRef.current = true
  }, [nodes])

  // Ball layout removed

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setSelectedNodeId(null)
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  useEffect(() => {
    if (!contextMenu) return
    const onClick = () => setContextMenu(null)
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [contextMenu])

  useEffect(() => {
    const onKeyDown = (event) => {
      const targetTag = event.target?.tagName?.toLowerCase()
      const isEditable =
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        event.target?.getAttribute?.('contenteditable') === 'true'

      if (event.key === 'Escape') {
        setSelectedNodeId(null)
        setDrawerOpen(false)
        return
      }

      if (isEditable) return

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        if (canEdit) handleAddNode()
      }

      if (event.key === 'Delete' && selectedNodeId) {
        event.preventDefault()
        if (canDeleteNodes && window.confirm('Delete this node?')) handleDeleteNode()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (canEdit) handleDuplicateNode()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canDeleteNodes, canEdit, handleAddNode, handleDeleteNode, handleDuplicateNode, selectedNodeId])

  const handleToggleFullscreen = useCallback(() => {
    const target = mapLayoutRef.current
    if (!target) return

    if (!document.fullscreenElement) {
      target.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const fullscreenTarget = isFullscreen
    ? document.fullscreenElement || mapLayoutRef.current
    : null
  const portalTarget = fullscreenTarget || document.body

  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay">
        <style>{`
          .dmtools-skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.18), rgba(255,255,255,0.06));
            background-size: 220% 100%;
            animation: dmtools-shimmer 1.4s infinite;
            border-radius: 12px;
          }
          @keyframes dmtools-shimmer {
            0% { background-position: 0% 0; }
            100% { background-position: -200% 0; }
          }
          .dmtools-modal-overlay {
            opacity: 0;
            animation: dmtools-fade-in 180ms ease forwards;
            backdrop-filter: blur(2px);
          }
          .dmtools-modal-panel {
            transform: translateY(18px) scale(0.98);
            opacity: 0;
            animation: dmtools-rise-in 220ms ease forwards;
          }
          .dmtools-modal-body > * {
            animation: dmtools-reveal 260ms ease both;
          }
          .dmtools-modal-body > *:nth-child(2) { animation-delay: 40ms; }
          .dmtools-modal-body > *:nth-child(3) { animation-delay: 80ms; }
          .dmtools-modal-body > *:nth-child(4) { animation-delay: 120ms; }
          .dmtools-modal-body > *:nth-child(5) { animation-delay: 160ms; }
          .dmtools-modal-body > *:nth-child(6) { animation-delay: 200ms; }
          .dmtools-toast {
            animation: dmtools-toast-in 220ms ease;
          }
          .dmtools-toast.dmtools-toast-leave {
            animation: dmtools-toast-out 240ms ease forwards;
          }
          .dmtools-node {
            transition: box-shadow 180ms ease, transform 180ms ease;
          }
          .dmtools-node:hover {
            box-shadow: 0 0 0 2px rgba(255,255,255,0.18), 0 8px 16px rgba(0,0,0,0.3);
            transform: translateY(-1px);
          }
          .dmtools-node-selected {
            box-shadow: 0 0 0 2px rgba(255,207,111,0.7), 0 0 24px rgba(255,207,111,0.35);
            animation: dmtools-pulse 1.6s ease-in-out infinite;
          }
          @keyframes dmtools-pulse {
            0%, 100% { box-shadow: 0 0 0 2px rgba(255,207,111,0.6), 0 0 18px rgba(255,207,111,0.3); }
            50% { box-shadow: 0 0 0 3px rgba(255,207,111,0.9), 0 0 28px rgba(255,207,111,0.5); }
          }
          @keyframes dmtools-fade-in {
            to { opacity: 1; }
          }
          @keyframes dmtools-rise-in {
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          @keyframes dmtools-reveal {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dmtools-toast-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dmtools-toast-out {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(8px); }
          }
          @media (max-width: 960px) {
            .dmtools-map-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
            .dmtools-map-actions {
              width: 100%;
              flex-wrap: wrap;
              justify-content: flex-start;
              gap: 10px;
            }
          }
          @media (max-width: 720px) {
            .dmtools-map-layout,
            .dmtools-map-layout.dmtools-left-open,
            .dmtools-map-layout.dmtools-left-closed {
              grid-template-columns: 1fr;
            }
            .dmtools-panel {
              max-width: none;
            }
            .dmtools-modal-panel {
              width: 94vw;
              max-height: 90vh;
              padding: 16px;
            }
            .dmtools-modal-panel img {
              height: 220px;
            }
            .dmtools-map-actions .dmtools-input {
              min-width: 100%;
            }
          }
        `}</style>
        <Link to="/dmtools" className="back-button dmtools-back">
          Back to DM Tools
        </Link>

        {!!errorMsg && (
          <div className="dmtools-subpage" style={{ marginBottom: 12 }}>
            <div className="dmtools-subcard">
              <strong>API error:</strong> {errorMsg}
              <div style={{ opacity: 0.8, marginTop: 6, fontSize: 12 }}>
                Tip: ellenorizd az API_BASE-t, hogy fut-e a backend, es hogy a token (JWT) be van-e allitva.
              </div>
            </div>
          </div>
        )}

        {!activeCampaign && (
          <div className="dmtools-subpage dmtools-chooser">
            <header>
              <h1>Map Forge</h1>
              <p>Start a new campaign map or continue an existing one.</p>
            </header>

            <div className="dmtools-chooser-grid">
              <div className="dmtools-subcard">
                <h2>Create a Campaign</h2>
                <p>Name your new campaign and spin up a fresh map.</p>
                <input
                  className="dmtools-input"
                  type="text"
                  placeholder="Campaign name"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                />
                <button className="dmtools-action" onClick={handleCreateCampaign} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>

              <div className="dmtools-subcard">
                <h2>Open Existing</h2>
                <p>Pick a campaign already in progress.</p>

                <select
                  className="dmtools-input"
                  value={existingId}
                  onChange={(event) => setExistingId(event.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a campaign</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {!campaign.isOwner ? ` (shared: ${campaign.accessRole})` : ''}
                    </option>
                  ))}
                </select>

                <button
                  className="dmtools-action"
                  onClick={handleOpenExisting}
                  disabled={loading || !existingId}
                >
                  Open Campaign
                </button>
              </div>
            </div>
          </div>
        )}

        {activeCampaign && (
          <div
            className={`dmtools-map-shell${isFullscreen ? ' dmtools-fullscreen' : ''}`}
            ref={mapLayoutRef}
          >
            <header className="dmtools-map-header">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div
                  onDragOver={(event) => {
                    if (!canEdit) return
                    event.preventDefault()
                    setCoverDragging(true)
                  }}
                  onDragLeave={() => setCoverDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setCoverDragging(false)
                    if (!canEdit) return
                    const file = event.dataTransfer.files?.[0]
                    if (file) handleUploadCover(file)
                  }}
                  style={{
                    width: 160,
                    height: 100,
                    borderRadius: 16,
                    border: coverDragging
                      ? '2px dashed var(--app-border, rgba(255,255,255,0.8))'
                      : '1px solid var(--app-border, rgba(255,255,255,0.15))',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'var(--app-panel, rgba(255,255,255,0.04))'
                  }}
                >
                  {activeCampaign?.coverImageUrl ? (
                    <img
                      src={toAbsUrl(activeCampaign.coverImageUrl)}
                      alt="cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onClick={() => setLightboxUrl(toAbsUrl(activeCampaign.coverImageUrl))}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        opacity: 0.6,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 1
                      }}
                    >
                      Drop cover
                    </div>
                  )}
                  <label
                    className="dmtools-action"
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      right: 8,
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: 0.92
                    }}
                  >
                    Set Cover
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadCover(file)
                        e.target.value = ''
                      }}
                      disabled={loading || !canEdit}
                    />
                  </label>
                </div>

                <div>
                  <h1>{campaignName || activeCampaign?.name || 'Campaign'}</h1>
                  {!isOwner && (
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                      Shared as {accessRole}
                    </div>
                  )}
                  <p>
                    Drag nodes, connect ideas, and filter the web.
                    {isDirty && !saving && (
                      <span style={{ marginLeft: 10, color: 'var(--app-accent, #ffcf6f)', fontWeight: 600 }}>Unsaved changes</span>
                    )}
                  </p>

                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    Hotkeys: N new, Del delete, Ctrl+D duplicate, Ctrl+F search, Esc close
                  </div>
                </div>
              </div>

              <div className="dmtools-map-actions">
                <button
                  className={`dmtools-action dmtools-ghost${leftPanelOpen ? ' is-active' : ''}`}
                  onClick={() => setLeftPanelOpen((prev) => !prev)}
                  disabled={loading}
                  type="button"
                >
                  Tools
                </button>
                <button
                  className="dmtools-action dmtools-ghost"
                  onClick={handleToggleFullscreen}
                  type="button"
                >
                  {isFullscreen ? 'Exit full screen' : 'Full screen'}
                </button>
                {isOwner && (
                  <button
                    className="dmtools-action"
                    onClick={() => {
                      setShareOpen(true)
                    }}
                    disabled={loading || shareLoading}
                  >
                    Share
                  </button>
                )}
                <button className="dmtools-action" onClick={handleAddNode} disabled={loading || !canEdit}>
                  Add Node
                </button>
                <select
                  className="dmtools-input"
                  value={layoutMode}
                  onChange={(event) => setLayoutMode(event.target.value)}
                  disabled={loading || !canEdit}
                  style={{ minWidth: 190 }}
                >
                  <option value="tree-vertical">Tree (top down)</option>
                  <option value="tree-horizontal">Tree (left to right)</option>
                  <option value="tree-compact">Tree (compact)</option>
                </select>
                <button className="dmtools-action" onClick={handleAutoLayout} disabled={loading || !canEdit}>
                  Auto-layout
                </button>
                <button className="dmtools-action" onClick={handleBackToChooser} disabled={loading}>
                  Switch Campaign
                </button>
              </div>
            </header>

            <div
              className={`dmtools-map-layout ${leftPanelOpen ? 'dmtools-left-open' : 'dmtools-left-closed'}`}
            >
              {leftPanelOpen && (
                <aside className="dmtools-panel">
                  <h2>Filters</h2>

                <label className="dmtools-label" htmlFor="dmtools-search">
                  Search
                </label>
                <input
                  id="dmtools-search"
                  className="dmtools-input"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search nodes"
                  disabled={loading}
                  ref={searchInputRef}
                />

                {search.trim() && (
                  <div className="dmtools-search-results">
                    <div className="dmtools-label">Matches</div>
                    {matchedNodes.length === 0 && (
                      <div className="dmtools-muted">No nodes found.</div>
                    )}
                    {matchedNodes.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        className="dmtools-search-item"
                        onClick={() => {
                          setSelectedNodeId(node.id)
                          setDrawerOpen(true)
                        }}
                        disabled={loading}
                      >
                        <div className="dmtools-search-item-title">{node.data?.label || 'Node'}</div>
                        <div className="dmtools-search-item-meta">
                          {node.data?.type || 'Location'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <label className="dmtools-label" htmlFor="dmtools-type">
                  Type
                </label>
                <select
                  id="dmtools-type"
                  className="dmtools-input"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  disabled={loading}
                >
                  <option value="all">All</option>
                  {NODE_TYPES.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>

                <label className="dmtools-label" htmlFor="dmtools-tag">
                  Tag filter
                </label>
                <input
                  id="dmtools-tag"
                  className="dmtools-input"
                  type="text"
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  placeholder="e.g. dungeon"
                  disabled={loading}
                />

                <div style={{ marginTop: 16 }}>
                  <label className="dmtools-label" htmlFor="dmtools-snap">
                    Snap to grid
                  </label>
                  <input
                    id="dmtools-snap"
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(event) => setSnapToGrid(event.target.checked)}
                    disabled={loading}
                    style={{ marginBottom: 10 }}
                  />

                  <label className="dmtools-label" htmlFor="dmtools-grid">
                    Grid size ({gridSize}px)
                  </label>
                  <input
                    id="dmtools-grid"
                    type="range"
                    min="10"
                    max="60"
                    value={gridSize}
                    onChange={(event) => setGridSize(Number(event.target.value))}
                    disabled={loading}
                    style={{ width: '100%' }}
                  />
                </div>
                </aside>
              )}

              <section
                className="dmtools-map-canvas"
                style={{ position: 'relative' }}
              >
                {loading && (
                  <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                    <div className="dmtools-skeleton" style={{ height: 140, animationDelay: '0ms' }} />
                    <div className="dmtools-skeleton" style={{ height: 120, animationDelay: '120ms' }} />
                    <div className="dmtools-skeleton" style={{ height: 160, animationDelay: '240ms' }} />
                  </div>
                )}

                {!loading && (
                  <ReactFlow
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={handleConnect}
                    nodesDraggable={canEdit}
                    nodesConnectable={canEdit}
                    edgesUpdatable={canEdit}
                    onInit={(instance) => {
                      reactFlowInstanceRef.current = instance
                      if (nodes.length) {
                        instance.fitView({ padding: 0.2, duration: 0 })
                        initialFitDoneRef.current = true
                      }
                    }}
                    onNodeClick={(_, node) => {
                      setSelectedNodeId(node.id)
                      setDrawerOpen(true)
                      setSelectedEdgeId(null)
                      setContextMenu(null)
                    }}
                    onNodeContextMenu={(event, node) => {
                      event.preventDefault()
                      setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id })
                      setSelectedNodeId(node.id)
                    }}
                    onEdgeClick={(event, edge) => {
                      if (!canEdit) return
                      event.stopPropagation()
                      setSelectedEdgeId(edge.id)
                      setEdgeLabelDraft(edge.label || '')
                      setEdgeEditorPos({ x: event.clientX, y: event.clientY })
                      setContextMenu(null)
                    }}
                    onNodeMouseEnter={(event, node) => {
                      setHoveredNode(node)
                      setHoverPos({ x: event.clientX, y: event.clientY })
                    }}
                    onNodeMouseMove={(event) => setHoverPos({ x: event.clientX, y: event.clientY })}
                    onNodeMouseLeave={() => setHoveredNode(null)}
                    onPaneClick={() => {
                      setSelectedNodeId(null)
                      setDrawerOpen(false)
                      setSelectedEdgeId(null)
                      setContextMenu(null)
                      setPaneMenu(null)
                    }}
                    onPaneContextMenu={(event) => {
                      event.preventDefault()
                      if (!ensureCanEdit()) return
                      const instance = reactFlowInstanceRef.current
                      let position = { x: 0, y: 0 }
                      if (instance?.screenToFlowPosition) {
                        position = instance.screenToFlowPosition({
                          x: event.clientX,
                          y: event.clientY
                        })
                      } else if (instance?.project) {
                        const bounds = event.currentTarget.getBoundingClientRect()
                        position = instance.project({
                          x: event.clientX - bounds.left,
                          y: event.clientY - bounds.top
                        })
                      }
                      setPaneMenu({ x: event.clientX, y: event.clientY, position })
                      setSelectedEdgeId(null)
                      setContextMenu(null)
                    }}
                    snapToGrid={snapToGrid}
                    snapGrid={[gridSize, gridSize]}
                    fitView
                  >
                    <MiniMap />
                    <Controls />
                    <Background gap={gridSize} />
                  </ReactFlow>
                )}

                {hoveredNode && (
                  <div
                    style={{
                      position: 'fixed',
                      left: hoverPos.x + 16,
                      top: hoverPos.y + 16,
                      zIndex: 30,
                      pointerEvents: 'none',
                      width: 220,
                      padding: 12,
                      background: 'var(--app-panel, rgba(10,10,10,0.92))',
                      border: '1px solid var(--app-border, rgba(255,255,255,0.15))',
                      borderRadius: 12,
                      boxShadow: '0 12px 24px rgba(0,0,0,0.35)'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      {hoveredNode.data?.label || 'Node'}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                      {hoveredNode.data?.type || 'Location'}
                    </div>
                    {hoveredNode.data?.imageUrl ? (
                      <img
                        src={toAbsUrl(hoveredNode.data.imageUrl)}
                        alt="thumb"
                        style={{
                          width: '100%',
                          height: 100,
                          objectFit: 'contain',
                          borderRadius: 10,
                          background: 'rgba(0,0,0,0.25)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: 100,
                          borderRadius: 10,
                          border: '1px solid var(--app-border, rgba(255,255,255,0.1))',
                          opacity: 0.4
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {(hoveredNode.data?.tags || []).slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 10,
                            padding: '4px 6px',
                            borderRadius: 10,
                            background: 'var(--app-panel, rgba(255,255,255,0.12))'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {contextMenu && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      position: 'fixed',
                      left: contextMenu.x,
                      top: contextMenu.y,
                      zIndex: 40,
                      background: 'var(--app-panel, rgba(16,16,16,0.96))',
                      border: '1px solid var(--app-border, rgba(255,255,255,0.12))',
                      borderRadius: 12,
                      padding: 8,
                      display: 'grid',
                      gap: 6,
                      minWidth: 160,
                      boxShadow: '0 16px 32px rgba(0,0,0,0.4)'
                    }}
                  >
                    <button className="dmtools-action" onClick={() => handleContextMenuAction('open')}>
                      Open details
                    </button>
                    <button
                      className="dmtools-action"
                      onClick={() => handleContextMenuAction('set-image')}
                      disabled={loading || !canEdit}
                    >
                      Set image
                    </button>
                    <button
                      className="dmtools-action"
                      onClick={() => handleContextMenuAction('duplicate')}
                      disabled={loading || !canEdit}
                    >
                      Duplicate
                    </button>
                    <button
                      className="dmtools-action dmtools-danger"
                      onClick={() => handleContextMenuAction('delete')}
                      disabled={loading || !canDeleteNodes}
                    >
                      Delete
                    </button>
                  </div>
                )}

                {paneMenu && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      position: 'fixed',
                      left: paneMenu.x,
                      top: paneMenu.y,
                      zIndex: 40,
                      background: 'var(--app-panel, rgba(16,16,16,0.96))',
                      border: '1px solid var(--app-border, rgba(255,255,255,0.12))',
                      borderRadius: 12,
                      padding: 8,
                      display: 'grid',
                      gap: 6,
                      minWidth: 140,
                      boxShadow: '0 16px 32px rgba(0,0,0,0.4)'
                    }}
                  >
                    <button
                      className="dmtools-action"
                      onClick={() => {
                        handleCreateNodeAt(paneMenu.position)
                        setPaneMenu(null)
                      }}
                      disabled={loading || !canEdit}
                    >
                      Add Node
                    </button>
                  </div>
                )}

                {selectedEdgeId && (
                  <div
                    style={{
                      position: 'fixed',
                      left: Math.min(edgeEditorPos.x + 12, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260),
                      top: Math.min(edgeEditorPos.y + 12, (typeof window !== 'undefined' ? window.innerHeight : 900) - 140),
                      zIndex: 40,
                      width: 240,
                      background: 'var(--app-panel, rgba(16,16,16,0.96))',
                      border: '1px solid var(--app-border, rgba(255,255,255,0.12))',
                      borderRadius: 12,
                      padding: 10,
                      boxShadow: '0 16px 32px rgba(0,0,0,0.4)'
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Relationship</div>
                    <input
                      className="dmtools-input"
                      type="text"
                      value={edgeLabelDraft}
                      onChange={(event) => setEdgeLabelDraft(event.target.value)}
                      onBlur={() => {
                        handleEdgeLabelCommit()
                        setSelectedEdgeId(null)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleEdgeLabelCommit()
                          setSelectedEdgeId(null)
                        }
                      }}
                      disabled={loading || !canEdit}
                    />
                  </div>
                )}
              </section>

            </div>
          </div>
        )}


        {shareOpen && isOwner &&
          createPortal(
            <div
              className="dmtools-modal-overlay"
              onClick={() => setShareOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 210,
                background: 'var(--app-overlay, rgba(0,0,0,0.55))',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                className="dmtools-modal-panel"
                style={{
                  width: 'min(900px, 92vw)',
                  maxHeight: '86vh',
                  overflow: 'auto',
                  background: 'var(--app-panel, rgba(16,16,16,0.98))',
                  border: '1px solid var(--app-border, rgba(255,255,255,0.12))',
                  borderRadius: 18,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                  padding: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ margin: 0 }}>Share Campaign</h2>
                  <button className="dmtools-action" onClick={() => setShareOpen(false)}>
                    Close
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                  <label className="dmtools-label" htmlFor="share-username">Username</label>
                  <input
                    id="share-username"
                    className="dmtools-input"
                    type="text"
                    placeholder="Invite by username"
                    value={shareUsername}
                    onChange={(event) => setShareUsername(event.target.value)}
                    disabled={shareLoading}
                  />
                  <label className="dmtools-label" htmlFor="share-role">Role</label>
                  <select
                    id="share-role"
                    className="dmtools-input"
                    value={shareRole}
                    onChange={(event) => setShareRole(event.target.value)}
                    disabled={shareLoading}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    className="dmtools-action"
                    onClick={handleShareInvite}
                    disabled={shareLoading || !shareUsername.trim()}
                  >
                    {shareLoading ? 'Saving...' : 'Share'}
                  </button>
                  {!!shareError && (
                    <div style={{ color: '#ff9c9c', fontSize: 12 }}>
                      {shareError}
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 600, marginBottom: 8 }}>Shared with</div>
                {shareList.length === 0 && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>No shares yet.</div>
                )}
                {shareList.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {shareList.map((share) => (
                      <div
                        key={share.userId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 160px 120px',
                          gap: 10,
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{share.username}</div>
                        <select
                          className="dmtools-input"
                          value={share.role}
                          onChange={(event) => handleUpdateShareRole(share.userId, event.target.value)}
                          disabled={shareLoading}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          className="dmtools-action dmtools-danger"
                          onClick={() => handleRemoveShare(share.userId)}
                          disabled={shareLoading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            portalTarget
          )}

        {drawerOpen && selectedNode &&
          createPortal(
            <div
              className="dmtools-modal-overlay"
              onClick={() => {
                setSelectedNodeId(null)
                setDrawerOpen(false)
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'var(--app-overlay, rgba(0,0,0,0.55))',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                className="dmtools-modal-panel"
                style={{
                  width: 'min(1100px, 92vw)',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  background: 'var(--app-panel, rgba(16,16,16,0.98))',
                  border: '1px solid var(--app-border, rgba(255,255,255,0.12))',
                  borderRadius: 18,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                  padding: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ margin: 0 }}>Node Details</h2>
                  <button className="dmtools-action" onClick={() => setDrawerOpen(false)}>
                    Close
                  </button>
                </div>

                <div className="dmtools-modal-body">
                  <div style={{ marginBottom: 14 }}>
                  {selectedNode.data?.imageUrl ? (
                    <img
                      src={toAbsUrl(selectedNode.data.imageUrl)}
                      alt="node"
                      style={{
                        width: '100%',
                        height: 260,
                        objectFit: 'contain',
                        background: 'var(--app-overlay, rgba(0,0,0,0.35))',
                        borderRadius: 16,
                        cursor: 'pointer'
                      }}
                      onClick={() => setLightboxUrl(toAbsUrl(selectedNode.data.imageUrl))}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: 260,
                        borderRadius: 16,
                        border: '1px solid var(--app-border, rgba(255,255,255,0.15))',
                        opacity: 0.35
                      }}
                    />
                  )}
                  </div>

                <label className="dmtools-label" htmlFor="dmtools-node-label">
                  Label
                </label>
                <input
                  id="dmtools-node-label"
                  className="dmtools-input"
                  type="text"
                  value={selectedNode.data?.label || ''}
                  onChange={(event) => updateNodeData(selectedNode.id, { label: event.target.value })}
                  disabled={loading || !canEdit}
                />

                <label className="dmtools-label" htmlFor="dmtools-node-type">
                  Type
                </label>
                <select
                  id="dmtools-node-type"
                  className="dmtools-input"
                  value={selectedNode.data?.type || 'Location'}
                  onChange={(event) => {
                    const newType = event.target.value
                    if (newType === 'Monster' && !selectedNode.data?.statblock) {
                      updateNodeData(selectedNode.id, { type: newType, statblock: {} })
                    } else {
                      updateNodeData(selectedNode.id, { type: newType })
                    }
                  }}
                  disabled={loading || !canEdit}
                >
                  {NODE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <label className="dmtools-label">Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <label className="dmtools-action" style={{ cursor: 'pointer' }}>
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadNodeImage(file)
                        e.target.value = ''
                      }}
                      disabled={loading || !canEdit}
                    />
                  </label>

                  {selectedNode.data?.imageUrl && (
                    <button
                      className="dmtools-action dmtools-danger"
                      onClick={handleRemoveNodeImage}
                      disabled={loading || !canEdit}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label className="dmtools-label" htmlFor="dmtools-node-tags">
                  Tags (comma separated)
                </label>
                <input
                  id="dmtools-node-tags"
                  className="dmtools-input"
                  type="text"
                  value={(selectedNode.data?.tags || []).join(', ')}
                  onChange={(event) =>
                    updateNodeData(selectedNode.id, {
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    })
                  }
                  disabled={loading || !canEdit}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="dmtools-label" htmlFor="dmtools-node-notes">
                    Notes
                  </label>
                  <button className="dmtools-action" onClick={handleInsertNpcDraft} disabled={loading || !canEdit}>
                    Insert NPC draft
                  </button>
                </div>
                <textarea
                  id="dmtools-node-notes"
                  className="dmtools-textarea"
                  value={selectedNode.data?.notes || ''}
                  onChange={(event) => updateNodeData(selectedNode.id, { notes: event.target.value })}
                  rows={6}
                  disabled={loading || !canEdit}
                />

                {(selectedNode.data?.type || '') === 'Monster' && (
                  <>
                    <label className="dmtools-label" htmlFor="dmtools-node-statblock">
                      Statblock (JSON)
                    </label>
                    <textarea
                      id="dmtools-node-statblock"
                      className="dmtools-textarea"
                      rows={10}
                      value={JSON.stringify(selectedNode.data?.statblock || {}, null, 2)}
                      onChange={(event) => {
                        const raw = event.target.value
                        try {
                          const parsed = raw.trim() ? JSON.parse(raw) : {}
                          updateNodeData(selectedNode.id, { statblock: parsed })
                          setErrorMsg('')
                        } catch {
                          setErrorMsg('Statblock JSON invalid.')
                        }
                      }}
                      disabled={loading || !canEdit}
                    />
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                      Tipp: ide barmilyen JSON-t irhatsz (AC, HP, actions, stb.). Autosave menti a kampanyba.
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button className="dmtools-action" onClick={handleDuplicateNode} disabled={loading || !canEdit}>
                    Duplicate
                  </button>
                  <button className="dmtools-action dmtools-danger" onClick={handleDeleteNode} disabled={loading || !canDeleteNodes}>
                    Delete Node
                  </button>
                </div>
                </div>
              </div>
            </div>,
            portalTarget
          )}


        <input
          ref={contextImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0]
            const nodeId = contextImageNodeIdRef.current
            if (file && nodeId) uploadNodeImage(nodeId, file)
            event.target.value = ''
            contextImageNodeIdRef.current = null
          }}
          disabled={loading || !canEdit}
        />

        {lightboxUrl &&
          createPortal(
            <div
              onClick={() => setLightboxUrl('')}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 220,
                background: 'var(--app-overlay, rgba(0,0,0,0.8))',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <img
                src={lightboxUrl}
                alt="lightbox"
                style={{ maxWidth: '90vw', maxHeight: '86vh', borderRadius: 16 }}
              />
            </div>,
            portalTarget
          )}

        {toasts.length > 0 && (
          <div
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              display: 'grid',
              gap: 10,
              zIndex: 90
            }}
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`dmtools-toast${toast.leaving ? ' dmtools-toast-leave' : ''}`}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background:
                    toast.type === 'error'
                      ? 'rgba(160,40,40,0.92)'
                      : 'rgba(30,120,70,0.92)',
                  color: 'white',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
                  fontSize: 14
                }}
              >
                {toast.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

