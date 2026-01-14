import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'
import '../assets/styles/DmtoolsDmScreen.css'

const exportStyles = `
  body { margin: 0; padding: 20px; background: #f6efe2; font-family: Georgia, "Times New Roman", serif; }
  .dm-screen-sheet { border: 2px solid #3a1d0f; padding: 18px; border-radius: 12px; background: #fff8e8; }
  .dm-screen-header { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .dm-screen-field label { display: block; font-weight: bold; margin-bottom: 6px; color: #3a1d0f; }
  .dm-screen-field input { width: 100%; padding: 8px 10px; border: 1px solid #6b4226; border-radius: 8px; }
  .dm-screen-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; }
  .dm-screen-card { border: 1px solid #6b4226; border-radius: 10px; padding: 12px; background: #fff3da; }
  .dm-screen-card h2 { margin: 0 0 8px; font-size: 16px; color: #3a1d0f; }
  .dm-screen-textarea { width: 100%; border: 1px solid #6b4226; border-radius: 8px; padding: 8px; min-height: 120px; }
  .span-4 { grid-column: span 4; } .span-5 { grid-column: span 5; } .span-6 { grid-column: span 6; } .span-7 { grid-column: span 7; } .span-12 { grid-column: span 12; }
`

export default function DmtoolsDmScreen() {
  const [campaignName, setCampaignName] = useState('')
  const [dmName, setDmName] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionNumber, setSessionNumber] = useState('')
  const [sessionFocus, setSessionFocus] = useState('')
  const [sceneFlow, setSceneFlow] = useState('')
  const [npcNotes, setNpcNotes] = useState('')
  const [locationNotes, setLocationNotes] = useState('')
  const [encounterNotes, setEncounterNotes] = useState('')
  const [lootNotes, setLootNotes] = useState('')
  const [rulesNotes, setRulesNotes] = useState('')
  const [playerNotes, setPlayerNotes] = useState('')

  const fileName = useMemo(() => {
    const safe = campaignName.trim().replace(/[^a-z0-9_-]+/gi, '-')
    return safe ? `dm-screen-${safe}.html` : 'dm-screen-template.html'
  }, [campaignName])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const sheet = document.getElementById('dm-screen-print')
    if (!sheet) {
      return
    }

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>DM Screen</title>
    <style>${exportStyles}</style>
  </head>
  <body>${sheet.outerHTML}</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay dm-screen-overlay">
        <Link to="/dmtools" className="back-button dmtools-back">
          Back to DM Tools
        </Link>

        <div className="dm-screen-controls">
          <div>
            <h1>DM Screen Template</h1>
            <p>Fill the sections, then print or download a clean copy.</p>
          </div>
          <div className="dm-screen-actions">
            <button className="dmtools-action" onClick={handleDownload}>
              Download
            </button>
            <button className="dmtools-action" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        <section id="dm-screen-print" className="dm-screen-sheet">
          <header className="dm-screen-header">
            <div className="dm-screen-field">
              <label htmlFor="dm-campaign">Campaign</label>
              <input
                id="dm-campaign"
                type="text"
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                placeholder="Campaign name"
              />
            </div>
            <div className="dm-screen-field">
              <label htmlFor="dm-name">Dungeon Master</label>
              <input
                id="dm-name"
                type="text"
                value={dmName}
                onChange={(event) => setDmName(event.target.value)}
                placeholder="DM name"
              />
            </div>
            <div className="dm-screen-field">
              <label htmlFor="dm-session">Session</label>
              <input
                id="dm-session"
                type="text"
                value={sessionNumber}
                onChange={(event) => setSessionNumber(event.target.value)}
                placeholder="Session number"
              />
            </div>
            <div className="dm-screen-field">
              <label htmlFor="dm-date">Date</label>
              <input
                id="dm-date"
                type="text"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
                placeholder="Session date"
              />
            </div>
          </header>

          <div className="dm-screen-grid">
            <div className="dm-screen-card span-7">
              <h2>Session Focus</h2>
              <textarea
                className="dm-screen-textarea"
                value={sessionFocus}
                onChange={(event) => setSessionFocus(event.target.value)}
                placeholder="Goal, themes, cliffhanger, reminders."
              />
            </div>
            <div className="dm-screen-card span-5">
              <h2>Scene Flow</h2>
              <textarea
                className="dm-screen-textarea"
                value={sceneFlow}
                onChange={(event) => setSceneFlow(event.target.value)}
                placeholder="Scene order, beats, timers."
              />
            </div>

            <div className="dm-screen-card span-4">
              <h2>NPCs</h2>
              <textarea
                className="dm-screen-textarea"
                value={npcNotes}
                onChange={(event) => setNpcNotes(event.target.value)}
                placeholder="Names, voices, goals."
              />
            </div>
            <div className="dm-screen-card span-4">
              <h2>Locations</h2>
              <textarea
                className="dm-screen-textarea"
                value={locationNotes}
                onChange={(event) => setLocationNotes(event.target.value)}
                placeholder="Places, clues, exits."
              />
            </div>
            <div className="dm-screen-card span-4">
              <h2>Encounters</h2>
              <textarea
                className="dm-screen-textarea"
                value={encounterNotes}
                onChange={(event) => setEncounterNotes(event.target.value)}
                placeholder="Monsters, tactics, difficulty."
              />
            </div>

            <div className="dm-screen-card span-6">
              <h2>Loot and Rewards</h2>
              <textarea
                className="dm-screen-textarea"
                value={lootNotes}
                onChange={(event) => setLootNotes(event.target.value)}
                placeholder="Treasure, gold, story rewards."
              />
            </div>
            <div className="dm-screen-card span-6">
              <h2>Rules and Conditions</h2>
              <textarea
                className="dm-screen-textarea"
                value={rulesNotes}
                onChange={(event) => setRulesNotes(event.target.value)}
                placeholder="House rules, hazards, conditions."
              />
            </div>

            <div className="dm-screen-card span-12">
              <h2>Player Notes</h2>
              <textarea
                className="dm-screen-textarea"
                value={playerNotes}
                onChange={(event) => setPlayerNotes(event.target.value)}
                placeholder="Character arcs, secrets, next steps."
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
