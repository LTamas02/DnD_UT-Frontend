import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/Navbar.css';
import '../assets/styles/WikiTheme.css'; // unified theme

const wikiSections = [
  { name: 'Backgrounds', path: '/wiki/backgrounds' },
  { name: 'Classes', path: '/wiki/classes' },
  { name: 'Equipments', path: '/wiki/equipments' },
  { name: 'Magic Items', path: '/wiki/magic-items' },
  { name: 'Magic Schools', path: '/wiki/magic-schools' },
  { name: 'Monsters', path: '/wiki/monsters' },
  { name: 'Proficiencies', path: '/wiki/proficiencies' },
  { name: 'Races', path: '/wiki/races' },
  { name: 'Spells', path: '/wiki/spells' }
];


const baseInfoSection = [
  { name: 'Ability Scores', path: '/wiki/ability-scores' },
  { name: 'Alignments', path: '/wiki/alignments' },
  { name: 'Conditions', path: '/wiki/conditions' },
  { name: 'Damage Types', path: '/wiki/damage-types' },
  { name: 'Languages', path: '/wiki/languages' },
  { name: 'Skills', path: '/wiki/skills' }
];

const Wiki = () => {
  return (
    <div className="page-comp">
      <div className="page-overlay">
        <h1>Wiki</h1>
        <p>Explore the different sections of the game wiki below:</p>

        {/* Card Grid */}
        <div className="wiki-grid">
          {wikiSections.map((section, index) => (
            <Link key={index} to={section.path} className="wiki-card">
              {section.name}
            </Link>
          ))}
        </div>
        <h1>Detailed Information</h1>

        {/* Card Grid */}
        <div className="wiki-grid">
          {baseInfoSection.map((section, index) => (
            <Link key={index} to={section.path} className="wiki-card">
              {section.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wiki;

