import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'
import '../assets/styles/DmtoolsEncounters.css'

const XP_THRESHOLDS = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
}

const CR_XP = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000
}

const MONSTER_COUNT_MULTIPLIER = [
  { min: 1, max: 1, value: 1 },
  { min: 2, max: 2, value: 1.5 },
  { min: 3, max: 6, value: 2 },
  { min: 7, max: 10, value: 2.5 },
  { min: 11, max: 14, value: 3 },
  { min: 15, max: Infinity, value: 4 }
]

const getMultiplier = (count) => {
  const match = MONSTER_COUNT_MULTIPLIER.find((range) => count >= range.min && count <= range.max)
  return match ? match.value : 1
}

const createMonster = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  count: 1,
  cr: 1,
  xp: CR_XP[1],
  notes: ''
})

export default function DmtoolsEncounters() {
  const [partySize, setPartySize] = useState(4)
  const [partyLevel, setPartyLevel] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [monsters, setMonsters] = useState([createMonster()])
  const [encounterNotes, setEncounterNotes] = useState('')
  const [tacticsNotes, setTacticsNotes] = useState('')
  const [lootNotes, setLootNotes] = useState('')

  const totalMonsters = useMemo(
    () => monsters.reduce((sum, monster) => sum + Number(monster.count || 0), 0),
    [monsters]
  )

  const rawXp = useMemo(
    () => monsters.reduce((sum, monster) => sum + Number(monster.count || 0) * Number(monster.xp || 0), 0),
    [monsters]
  )

  const multiplier = useMemo(() => getMultiplier(totalMonsters || 1), [totalMonsters])
  const adjustedXp = useMemo(() => Math.round(rawXp * multiplier), [rawXp, multiplier])

  const budget = useMemo(() => {
    const threshold = XP_THRESHOLDS[partyLevel] || XP_THRESHOLDS[5]
    return threshold[difficulty] * partySize
  }, [partyLevel, partySize, difficulty])

  const ratio = budget ? adjustedXp / budget : 0
  const assessment =
    ratio < 0.6
      ? 'Too weak'
      : ratio < 0.9
      ? 'A bit light'
      : ratio <= 1.1
      ? 'On target'
      : ratio <= 1.4
      ? 'Too strong'
      : 'Deadly spike'

  const handleMonsterChange = (id, field, value) => {
    setMonsters((prev) =>
      prev.map((monster) =>
        monster.id === id
          ? {
              ...monster,
              [field]: value,
              ...(field === 'cr' ? { xp: CR_XP[value] || monster.xp } : {})
            }
          : monster
      )
    )
  }

  const handleAddMonster = () => {
    setMonsters((prev) => [...prev, createMonster()])
  }

  const handleRemoveMonster = (id) => {
    setMonsters((prev) => prev.filter((monster) => monster.id !== id))
  }

  return (
    <div className="page-comp dmtools-page encounter-page">
      <div className="page-overlay dmtools-overlay encounter-overlay">
        <Link to="/dmtools" className="back-button dmtools-back">
          Back to DM Tools
        </Link>

        <section className="encounter-hero">
          <div>
            <span className="encounter-kicker">Encounter Builder</span>
            <h1>Orchestrate battle beats like a war-room.</h1>
            <p>
              Tune XP budgets, sculpt enemy waves, and keep dramatic pacing on a single command
              canvas. Every stat stays visible while you improvise.
            </p>
          </div>
          <div className="encounter-hero-panel">
            <div>
              <strong>{adjustedXp}</strong>
              <span>Adjusted XP</span>
            </div>
            <div>
              <strong>{budget}</strong>
              <span>Budget</span>
            </div>
            <div>
              <strong>{totalMonsters}</strong>
              <span>Enemies</span>
            </div>
            <div className={`encounter-pill ${adjustedXp >= budget ? 'encounter-pill-danger' : ''}`}>
              {assessment}
            </div>
          </div>
        </section>

        <section className="encounter-grid">
          <div className="encounter-panel encounter-panel-party">
            <h2>Party</h2>
            <div className="encounter-fields">
              <label>
                Party size
                <input
                  type="number"
                  min="1"
                  value={partySize}
                  onChange={(event) => setPartySize(Number(event.target.value))}
                />
              </label>
              <label>
                Average level
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partyLevel}
                  onChange={(event) => setPartyLevel(Number(event.target.value))}
                />
              </label>
              <label>
                Difficulty
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="deadly">Deadly</option>
                </select>
              </label>
            </div>
          </div>

          <div className="encounter-panel encounter-panel-enemies">
            <div className="encounter-panel-header">
              <h2>Enemies</h2>
              <button className="dmtools-action encounter-add" onClick={handleAddMonster}>
                Add enemy
              </button>
            </div>

            <div className="encounter-table">
              <div className="encounter-row encounter-row-header">
                <span>Name</span>
                <span>Count</span>
                <span>CR</span>
                <span>XP</span>
                <span>Notes</span>
                <span />
              </div>
              {monsters.map((monster) => (
                <div key={monster.id} className="encounter-row">
                  <input
                    value={monster.name}
                    placeholder="Enemy name"
                    onChange={(event) => handleMonsterChange(monster.id, 'name', event.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    value={monster.count}
                    onChange={(event) => handleMonsterChange(monster.id, 'count', Number(event.target.value))}
                  />
                  <select
                    value={monster.cr}
                    onChange={(event) => handleMonsterChange(monster.id, 'cr', Number(event.target.value))}
                  >
                    {[0, 0.125, 0.25, 0.5, ...Array.from({ length: 30 }, (_, i) => i + 1)].map((cr) => (
                      <option key={cr} value={cr}>
                        {cr}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={monster.xp}
                    onChange={(event) => handleMonsterChange(monster.id, 'xp', Number(event.target.value))}
                  />
                  <input
                    value={monster.notes}
                    placeholder="Tactics, role"
                    onChange={(event) => handleMonsterChange(monster.id, 'notes', event.target.value)}
                  />
                  <button
                    className="dmtools-action dmtools-danger"
                    onClick={() => handleRemoveMonster(monster.id)}
                    disabled={monsters.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="encounter-panel encounter-assessment">
            <h2>Assessment</h2>
            <div className={`encounter-assessment-pill ${adjustedXp >= budget ? 'encounter-pill-danger' : ''}`}>
              {assessment}
            </div>
            <div className="encounter-assessment-meta">
              <div>
                <span>Adjusted XP</span>
                <strong>{adjustedXp}</strong>
              </div>
              <div>
                <span>Budget</span>
                <strong>{budget}</strong>
              </div>
              <div>
                <span>Multiplier</span>
                <strong>x{multiplier}</strong>
              </div>
            </div>
          </div>

          <div className="encounter-panel encounter-notes">
            <h2>Pacing notes</h2>
            <textarea
              value={encounterNotes}
              onChange={(event) => setEncounterNotes(event.target.value)}
              placeholder="Phase changes, reinforcements, terrain cues."
            />
          </div>

          <div className="encounter-panel encounter-notes">
            <h2>Tactics</h2>
            <textarea
              value={tacticsNotes}
              onChange={(event) => setTacticsNotes(event.target.value)}
              placeholder="Enemy goals, formations, retreat triggers."
            />
          </div>

          <div className="encounter-panel encounter-notes">
            <h2>Loot & aftermath</h2>
            <textarea
              value={lootNotes}
              onChange={(event) => setLootNotes(event.target.value)}
              placeholder="Rewards, clues, collateral damage."
            />
          </div>
        </section>
      </div>
    </div>
  )
}
