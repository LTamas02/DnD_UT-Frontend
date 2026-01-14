import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'

export default function DmtoolsEncounters() {
  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay">
        <div className="dmtools-subpage">
          <Link to="/dmtools" className="back-button dmtools-back">
            Back to DM Tools
          </Link>
          <header>
            <h1>Encounter Builder</h1>
            <p>Plan combat beats and dial the challenge rating.</p>
          </header>
          <div className="dmtools-subcard">
            <p>Build encounter groups, track XP budgets, and keep notes for pacing.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
