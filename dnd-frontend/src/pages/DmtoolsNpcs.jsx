import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'
import '../assets/styles/DmtoolsNpcs.css'

const randomPick = (list) => list[Math.floor(Math.random() * list.length)]

const namePools = {
  human: ['Arlen', 'Maeve', 'Corin', 'Talia', 'Ronan', 'Elara', 'Jarek', 'Lyra', 'Bram', 'Soren'],
  elf: ['Aelar', 'Sylrae', 'Thalion', 'Faeliv', 'Nyxara', 'Erdan', 'Lirael', 'Vaeris'],
  dwarf: ['Borin', 'Hilda', 'Garrik', 'Sigrid', 'Durik', 'Brunna', 'Korrin', 'Helga'],
  tiefling: ['Zareth', 'Kaela', 'Mira', 'Riven', 'Sethra', 'Izzik', 'Vexa', 'Nox'],
  halfling: ['Pip', 'Mira', 'Tess', 'Hob', 'Ludo', 'Fenn', 'Rosie', 'Bree']
}

const roles = [
  'Guild fixer',
  'Haunted archivist',
  'Mercenary captain',
  'Street oracle',
  'Disgraced noble',
  'Temple warden',
  'Blackmarket broker',
  'Frontier scout',
  'Alchemist',
  'Court bard'
]

const demeanors = ['Warm and disarming', 'Cold and precise', 'Restless and twitchy', 'Gravely calm', 'Playfully evasive']
const voices = ['Low rasp', 'Soft and measured', 'Quick staccato', 'Sing-song', 'Velvet smooth']
const goals = [
  'Wants to erase a debt',
  'Seeks a lost relic',
  'Protects a hidden family',
  'Wants revenge on a rival',
  'Wants to reclaim a title'
]
const secrets = [
  'Is a double agent',
  'Has a cursed pact',
  'Knows the villain personally',
  'Stole something priceless',
  'Is hiding their true name'
]
const hooks = [
  'Offers a secret map',
  'Needs an escort tonight',
  'Has a clue in a locked box',
  'Wants a favor from the party',
  'Can call in a safehouse'
]
const species = ['Human', 'Elf', 'Dwarf', 'Tiefling', 'Halfling']

const buildNpcNote = (npc) => {
  return [
    `NPC: ${npc.name || 'Unnamed'}`,
    `Role: ${npc.role || '-'}`,
    `Species: ${npc.species || '-'}`,
    `Demeanor: ${npc.demeanor || '-'}`,
    `Voice: ${npc.voice || '-'}`,
    `Goal: ${npc.goal || '-'}`,
    `Secret: ${npc.secret || '-'}`,
    `Hook: ${npc.hook || '-'}`
  ].join('\n')
}

export default function DmtoolsNpcs() {
  const [npc, setNpc] = useState({
    name: '',
    role: '',
    species: '',
    demeanor: '',
    voice: '',
    goal: '',
    secret: '',
    hook: ''
  })
  const [vault, setVault] = useState([])
  const [status, setStatus] = useState('')

  const npcNote = useMemo(() => buildNpcNote(npc), [npc])

  useEffect(() => {
    const stored = localStorage.getItem('npcVault')
    if (stored) {
      try {
        setVault(JSON.parse(stored))
      } catch {
        setVault([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('npcNotesDraft', npcNote)
  }, [npcNote])

  const handleGenerate = useCallback(() => {
    const nextSpecies = randomPick(species)
    const namePool = namePools[nextSpecies.toLowerCase()] || namePools.human
    const nextNpc = {
      name: randomPick(namePool),
      role: randomPick(roles),
      species: nextSpecies,
      demeanor: randomPick(demeanors),
      voice: randomPick(voices),
      goal: randomPick(goals),
      secret: randomPick(secrets),
      hook: randomPick(hooks)
    }
    setNpc(nextNpc)
    setStatus('Generated a fresh NPC.')
  }, [])

  const handleSave = useCallback(() => {
    const saved = [{ ...npc, id: `${Date.now()}-${Math.random().toString(16).slice(2)}` }, ...vault]
    setVault(saved)
    localStorage.setItem('npcVault', JSON.stringify(saved))
    setStatus('Saved to NPC vault.')
  }, [npc, vault])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(npcNote)
      setStatus('Copied for notes.')
    } catch {
      setStatus('Copy failed. You can select the text manually.')
    }
  }, [npcNote])

  const handleClear = useCallback(() => {
    setNpc({
      name: '',
      role: '',
      species: '',
      demeanor: '',
      voice: '',
      goal: '',
      secret: '',
      hook: ''
    })
    setStatus('Cleared.')
  }, [])

  return (
    <div className="page-comp dmtools-page npc-page">
      <div className="page-overlay dmtools-overlay npc-overlay">
        <Link to="/dmtools" className="back-button dmtools-back">
          Back to DM Tools
        </Link>

        <section className="npc-hero">
          <div className="npc-hero-copy">
            <span className="npc-kicker">NPC Generator</span>
            <h1>Forge memorable faces in seconds.</h1>
            <p>
              Build cinematic NPCs with voice, secret, and hook. Export them straight into your
              map notes or keep them ready in a personal vault.
            </p>
            <div className="npc-hero-actions">
              <button className="dmtools-action npc-primary" onClick={handleGenerate}>
                Generate NPC
              </button>
              <button className="dmtools-action npc-ghost" onClick={handleSave}>
                Save to Vault
              </button>
              <button className="dmtools-action npc-ghost" onClick={handleCopy}>
                Copy for Notes
              </button>
              <button className="dmtools-action npc-ghost" onClick={handleClear}>
                Clear
              </button>
            </div>
            {status && <div className="npc-status">{status}</div>}
            <div className="npc-hint">Draft syncs to Map notes with "Insert NPC draft".</div>
          </div>
          <div className="npc-hero-orbs">
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="npc-layout">
          <div className="npc-form">
            <div className="npc-field">
              <label>Name</label>
              <input
                value={npc.name}
                onChange={(event) => setNpc((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
              />
            </div>
            <div className="npc-field">
              <label>Role</label>
              <input
                value={npc.role}
                onChange={(event) => setNpc((prev) => ({ ...prev, role: event.target.value }))}
                placeholder="Role"
              />
            </div>
            <div className="npc-field">
              <label>Species</label>
              <input
                value={npc.species}
                onChange={(event) => setNpc((prev) => ({ ...prev, species: event.target.value }))}
                placeholder="Species"
              />
            </div>
            <div className="npc-field">
              <label>Demeanor</label>
              <input
                value={npc.demeanor}
                onChange={(event) => setNpc((prev) => ({ ...prev, demeanor: event.target.value }))}
                placeholder="Demeanor"
              />
            </div>
            <div className="npc-field">
              <label>Voice</label>
              <input
                value={npc.voice}
                onChange={(event) => setNpc((prev) => ({ ...prev, voice: event.target.value }))}
                placeholder="Voice"
              />
            </div>
            <div className="npc-field npc-field-full">
              <label>Goal</label>
              <textarea
                value={npc.goal}
                onChange={(event) => setNpc((prev) => ({ ...prev, goal: event.target.value }))}
                placeholder="What do they want?"
              />
            </div>
            <div className="npc-field npc-field-full">
              <label>Secret</label>
              <textarea
                value={npc.secret}
                onChange={(event) => setNpc((prev) => ({ ...prev, secret: event.target.value }))}
                placeholder="What are they hiding?"
              />
            </div>
            <div className="npc-field npc-field-full">
              <label>Hook</label>
              <textarea
                value={npc.hook}
                onChange={(event) => setNpc((prev) => ({ ...prev, hook: event.target.value }))}
                placeholder="How does the party meet them?"
              />
            </div>
          </div>

          <div className="npc-preview">
            <div className="npc-card">
              <div className="npc-card-title">{npc.name || 'Unnamed NPC'}</div>
              <div className="npc-card-subtitle">{npc.role || 'Role not set'}</div>
              <div className="npc-card-grid">
                <div>
                  <span>Species</span>
                  <strong>{npc.species || '-'}</strong>
                </div>
                <div>
                  <span>Demeanor</span>
                  <strong>{npc.demeanor || '-'}</strong>
                </div>
                <div>
                  <span>Voice</span>
                  <strong>{npc.voice || '-'}</strong>
                </div>
              </div>
              <div className="npc-card-notes">
                <div>
                  <h4>Goal</h4>
                  <p>{npc.goal || '—'}</p>
                </div>
                <div>
                  <h4>Secret</h4>
                  <p>{npc.secret || '—'}</p>
                </div>
                <div>
                  <h4>Hook</h4>
                  <p>{npc.hook || '—'}</p>
                </div>
              </div>
              <div className="npc-note-preview">
                <h4>Notes Export</h4>
                <pre>{npcNote}</pre>
              </div>
            </div>

            <div className="npc-vault">
              <h3>NPC Vault</h3>
              {vault.length === 0 && <p>No saved NPCs yet.</p>}
              <div className="npc-vault-list">
                {vault.slice(0, 6).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setNpc(entry)}
                    className="npc-vault-item"
                  >
                    <strong>{entry.name}</strong>
                    <span>{entry.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
