import React, { useMemo, useState, useEffect, useRef } from 'react'
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
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'
import '../assets/styles/DmtoolsMaps.css'

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
  const token = localStorage.getItem('token') // <-- ha nálad más név, itt írd át

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
      throw new Error('Unauthorized (401). Jelentkezz be újra, vagy hiányzik a token.')
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
      throw new Error('Unauthorized (401). Jelentkezz be újra, vagy hiányzik a token.')
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

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Debounce autosave
  const saveTimerRef = useRef(null)
  const hydratedRef = useRef(false)

  // ===== Load campaign list =====
  const refreshCampaigns = async () => {
    const list = await api('/api/mapforge/campaigns')
    setCampaigns(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setErrorMsg('')
        const list = await api('/api/mapforge/campaigns')
        if (!cancelled) setCampaigns(Array.isArray(list) ? list : [])
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
        setSearch('')
        setTypeFilter('all')
        setTagFilter('')

        hydratedRef.current = true
      } catch (e) {
        if (!cancelled) setErrorMsg(e.message || 'Failed to load campaign')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeCampaignId, setEdges, setNodes])

  // ===== Autosave (debounced) =====
  useEffect(() => {
    if (!activeCampaignId) return
    if (!hydratedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      try {
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
              ? { ...c, name: updated.name, updatedAt: updated.updatedAt, coverImageUrl: updated.coverImageUrl ?? c.coverImageUrl }
              : c
          )
        )
      } catch (e) {
        setErrorMsg(e.message || 'Save failed')
      } finally {
        setSaving(false)
      }
    }, 600)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [nodes, edges, campaignName, activeCampaignId])

  const activeCampaign = useMemo(
    () => campaigns.find((item) => item.id === activeCampaignId) || null,
    [campaigns, activeCampaignId]
  )

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

      return { ...node, hidden: !(matchesSearch && matchesType && matchesTag) }
    })
  }, [nodes, search, typeFilter, tagFilter])

  const visibleEdges = useMemo(() => {
    const visibility = new Map(visibleNodes.map((node) => [node.id, !node.hidden]))
    return edges.map((edge) => ({
      ...edge,
      hidden: !(visibility.get(edge.source) && visibility.get(edge.target))
    }))
  }, [edges, visibleNodes])

  const handleCreateCampaign = async () => {
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
    } catch (e) {
      setErrorMsg(e.message || 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenExisting = () => {
    if (!existingId) return
    setActiveCampaignId(existingId)
  }

  const handleBackToChooser = async () => {
    setActiveCampaignId(null)
    hydratedRef.current = false

    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setCampaignName('')
    setSearch('')
    setTypeFilter('all')
    setTagFilter('')

    try {
      await refreshCampaigns()
    } catch {
      // ignore
    }
  }

  const handleAddNode = () => {
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
  }

  const handleConnect = (params) => {
    setEdges((prev) => addEdge({ ...params, type: 'smoothstep' }, prev))
  }

  const updateNodeData = (nodeId, updates) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      )
    )
  }

  const handleDeleteNode = () => {
    if (!selectedNodeId) return
    setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId))
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId)
    )
    setSelectedNodeId(null)
  }

  // ===== Campaign cover upload =====
  const handleUploadCover = async (file) => {
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
      }
    } catch (e) {
      setErrorMsg(e.message || 'Cover upload failed')
    } finally {
      setLoading(false)
    }
  }

  // ===== Node image upload/remove =====
  const handleUploadNodeImage = async (file) => {
    if (!file || !activeCampaignId || !selectedNode) return

    try {
      setLoading(true)
      setErrorMsg('')

      const out = await apiUpload(
        `/api/mapforge/campaigns/${encodeURIComponent(activeCampaignId)}/nodes/${encodeURIComponent(
          selectedNode.id
        )}/image`,
        file
      )

      const imageUrl = out?.imageUrl
      if (imageUrl) {
        updateNodeData(selectedNode.id, { imageUrl })
      }
    } catch (e) {
      setErrorMsg(e.message || 'Node image upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveNodeImage = async () => {
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
    } catch (e) {
      setErrorMsg(e.message || 'Remove image failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay">
        <Link to="/dmtools" className="back-button dmtools-back">
          Back to DM Tools
        </Link>

        {!!errorMsg && (
          <div className="dmtools-subpage" style={{ marginBottom: 12 }}>
            <div className="dmtools-subcard">
              <strong>API error:</strong> {errorMsg}
              <div style={{ opacity: 0.8, marginTop: 6, fontSize: 12 }}>
                Tip: ellenőrizd az API_BASE-t, hogy fut-e a backend, és hogy a token (JWT) be van-e állítva.
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
          <div className="dmtools-map-shell">
            <header className="dmtools-map-header">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {activeCampaign?.coverImageUrl ? (
                  <img
                    src={toAbsUrl(activeCampaign.coverImageUrl)}
                    alt="cover"
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      opacity: 0.35
                    }}
                  />
                )}

                <div>
                  <h1>{campaignName || activeCampaign?.name || 'Campaign'}</h1>
                  <p>
                    Drag nodes, connect ideas, and filter the web.
                    {saving && <span style={{ marginLeft: 10, opacity: 0.8 }}>Saving...</span>}
                    {!saving && hydratedRef.current && (
                      <span style={{ marginLeft: 10, opacity: 0.6 }}>Saved</span>
                    )}
                  </p>

                  <label className="dmtools-action" style={{ cursor: 'pointer', display: 'inline-flex' }}>
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
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>

              <div className="dmtools-map-actions">
                <button className="dmtools-action" onClick={handleAddNode} disabled={loading}>
                  Add Node
                </button>
                <button className="dmtools-action" onClick={handleBackToChooser} disabled={loading}>
                  Switch Campaign
                </button>
              </div>
            </header>

            <div className="dmtools-map-layout">
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
                />

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
              </aside>

              <section className="dmtools-map-canvas">
                {loading && (
                  <div className="dmtools-subcard" style={{ margin: 12 }}>
                    Loading campaign...
                  </div>
                )}

                {!loading && (
                  <ReactFlow
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                  >
                    <MiniMap />
                    <Controls />
                    <Background gap={20} />
                  </ReactFlow>
                )}
              </section>

              <aside className="dmtools-panel">
                <h2>Node Details</h2>
                {!selectedNode && <p>Select a node to edit its details.</p>}

                {selectedNode && (
                  <>
                    <label className="dmtools-label" htmlFor="dmtools-node-label">
                      Label
                    </label>
                    <input
                      id="dmtools-node-label"
                      className="dmtools-input"
                      type="text"
                      value={selectedNode.data?.label || ''}
                      onChange={(event) => updateNodeData(selectedNode.id, { label: event.target.value })}
                      disabled={loading}
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
                        // ha Monsterre váltasz, adunk egy default statblockot (üres object)
                        if (newType === 'Monster' && !selectedNode.data?.statblock) {
                          updateNodeData(selectedNode.id, { type: newType, statblock: {} })
                        } else {
                          updateNodeData(selectedNode.id, { type: newType })
                        }
                      }}
                      disabled={loading}
                    >
                      {NODE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    {/* Node Image Upload */}
                    <label className="dmtools-label">Image</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      {selectedNode.data?.imageUrl ? (
                        <img
                          src={toAbsUrl(selectedNode.data.imageUrl)}
                          alt="node"
                          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.15)',
                            opacity: 0.35
                          }}
                        />
                      )}

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
                          disabled={loading}
                        />
                      </label>

                      {selectedNode.data?.imageUrl && (
                        <button className="dmtools-action dmtools-danger" onClick={handleRemoveNodeImage} disabled={loading}>
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
                      disabled={loading}
                    />

                    <label className="dmtools-label" htmlFor="dmtools-node-notes">
                      Notes
                    </label>
                    <textarea
                      id="dmtools-node-notes"
                      className="dmtools-textarea"
                      value={selectedNode.data?.notes || ''}
                      onChange={(event) => updateNodeData(selectedNode.id, { notes: event.target.value })}
                      rows={6}
                      disabled={loading}
                    />

                    {/* Monster statblock JSON editor (backend NodeData.statblock) */}
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
                              // ha eddig JSON error volt, töröljük
                              setErrorMsg('')
                            } catch {
                              setErrorMsg('Statblock JSON invalid.')
                            }
                          }}
                          disabled={loading}
                        />
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                          Tipp: ide bármilyen JSON-t írhatsz (AC, HP, actions, stb.). Autosave menti a kampányba.
                        </div>
                      </>
                    )}

                    <button className="dmtools-action dmtools-danger" onClick={handleDeleteNode} disabled={loading}>
                      Delete Node
                    </button>
                  </>
                )}
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
