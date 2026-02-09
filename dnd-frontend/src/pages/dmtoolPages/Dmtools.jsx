import React from 'react'
import { Link } from 'react-router-dom'
import '../../assets/styles/WikiTheme.css'
import '../../assets/styles/Dmtools.css'
import encounterImage from '../../assets/img/BG/classes/fighter.jpg'
import npcImage from '../../assets/img/BG/classes/bard.jpg'
import lootImage from '../../assets/img/BG/classes/cleric.jpg'
import mapImage from '../../assets/img/BG/classes/wizard.jpg'
import vttImage from '../../assets/img/BG/classes/warlock.jpg'

export default function Dmtools() {
  const dmTools = [
    {
      name: 'Encounter Builder',
      description: 'Balance fights, track XP, and tune difficulty.',
      path: '/dmtools/encounters',
      image: encounterImage
    },
    {
      name: 'NPC Generator',
      description: 'Spin up memorable NPCs with quick details.',
      path: '/dmtools/npcs',
      image: npcImage
    }
    // ,
    // {
    //   name: 'Treasure Vault',
    //   description: 'Curate loot tables and hoards in minutes.',
    //   path: '/dmtools/loot',
    //   image: lootImage
    // }
    ,
    {
      name: 'Map Forge',
      description: 'Sketch locations and keep notes organized.',
      path: '/dmtools/maps',
      image: mapImage
    }
    //,
    // {
    //   name: 'Virtual Tabletop',
    //   description: 'Run battles with maps, tokens, chat, and dice.',
    //   path: '/vtt',
    //   image: vttImage
    // }
  ]

  return (
    <div className="page-comp dmtools-page">
      <div className="page-overlay dmtools-overlay">
        <header className="dmtools-header">
          <h1>DM Tools</h1>
          <p>Pick a toolbox to prep your next session.</p>
        </header>

        <div className="dmtools-grid">
          {dmTools.map((tool) => (
            <Link key={tool.name} to={tool.path} className="dmtools-card">
              <img src={tool.image} alt={tool.name} />
              <div className="dmtools-card-body">
                <h2>{tool.name}</h2>
                <p>{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


