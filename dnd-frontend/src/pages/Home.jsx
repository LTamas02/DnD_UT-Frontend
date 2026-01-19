import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/Navbar.css'
import '../assets/styles/Home.css'

const Home = () => {
  return (
    <div id="home-comp" className="home-shell">
      <main className="home-main">
        <section className="home-hero">
          <div className="hero-copy">
            <div className="hero-kicker">Dungeon Master Toolkit</div>
            <h1>Command the table with a cinematic campaign cockpit.</h1>
            <p>
              Map forge, encounter planning, and living lore — built to feel like a modern
              command deck for your world. Sketch new arcs, connect NPCs, and keep the chaos
              readable at a glance.
            </p>
            <div className="hero-cta">
              <Link to="/dmtools" className="home-btn home-btn-primary">
                Enter DM Tools
              </Link>
              <Link to="/dmtools/maps" className="home-btn home-btn-ghost">
                Open Map Forge
              </Link>
            </div>
            <div className="hero-meta">
              <div>
                <span className="hero-meta-label">Live Map</span>
                <span className="hero-meta-value">Mind-map your campaign</span>
              </div>
              <div>
                <span className="hero-meta-label">Realtime Save</span>
                <span className="hero-meta-value">Never lose a twist</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-title">Campaign Pulse</div>
            <div className="panel-card">
              <div className="panel-card-title">EoTV: The Ember Gate</div>
              <div className="panel-card-subtitle">12 nodes · 9 links · 4 factions</div>
              <div className="panel-card-map" />
              <div className="panel-card-tags">
                <span>Dungeon</span>
                <span>Faction</span>
                <span>Quest</span>
              </div>
            </div>
            <div className="panel-stats">
              <div>
                <strong>03</strong>
                <span>Active arcs</span>
              </div>
              <div>
                <strong>07</strong>
                <span>Locations</span>
              </div>
              <div>
                <strong>14</strong>
                <span>NPC threads</span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-highlights">
          <div className="highlight-card">
            <h3>Map Forge</h3>
            <p>Grow your world like a neural map. Branch narratives, drop images, and trace rivals.</p>
          </div>
          <div className="highlight-card">
            <h3>Encounter Desk</h3>
            <p>Track monsters, loot, and story beats in one command view for live sessions.</p>
          </div>
          <div className="highlight-card">
            <h3>Living Lore</h3>
            <p>Codify your factions and mysteries, then keep them searchable when players improvise.</p>
          </div>
        </section>

        <section className="home-flow">
          <div>
            <h2>Build sessions like a story engine.</h2>
            <p>
              Start with your core location, branch into conflicts, then chain NPCs and
              items into a visible network. Every node tells a piece of the myth.
            </p>
          </div>
          <div className="flow-steps">
            <div>
              <span>01</span>
              <strong>Anchor the world</strong>
              <p>Pick your primary location and drop the first nodes.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Wire the drama</strong>
              <p>Add relationships, rivalries, and debts.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Run the table</strong>
              <p>Keep everything connected while you narrate.</p>
            </div>
          </div>
        </section>

        <section className="home-cta-final">
          <div>
            <h2>Ready to open the map?</h2>
            <p>Launch the DM tools and bring your campaign to life in minutes.</p>
          </div>
          <Link to="/dmtools" className="home-btn home-btn-primary">
            Start the session
          </Link>
        </section>
      </main>
    </div>
  )
}

export default Home
