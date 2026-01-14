import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/WikiTheme.css'
import '../assets/styles/Dmtools.css'

export default function DmtoolsLoot() {
  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay">
        <div className="dmtools-subpage">
          <Link to="/dmtools" className="back-button dmtools-back">
            Back to DM Tools
          </Link>
          <header>
            <h1>Treasure Vault</h1>
            <p>Reward players with loot that fits the story.</p>
          </header>
          <div className="dmtools-subcard">
            <p>Organize treasure tables, magic items, and custom rewards.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
