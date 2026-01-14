import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'

export default function DmtoolsNpcs() {
  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay">
        <div className="dmtools-subpage">
          <Link to="/dmtools" className="back-button dmtools-back">
            Back to DM Tools
          </Link>
          <header>
            <h1>NPC Generator</h1>
            <p>Quickly outline allies, rivals, and shopkeepers.</p>
          </header>
          <div className="dmtools-subcard">
            <p>Capture names, quirks, voices, and motivations for every scene.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
