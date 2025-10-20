import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/Navbar.css';
import '../assets/styles/WikiTheme.css'; // unified theme

const wikiSections = [
  { name: 'Spells', path: '/wiki/spells' },
  { name: 'Races', path: '/wiki/races' },
  { name: 'Backgrounds', path: '/wiki/backgrounds' },
  { name: 'Heroic Chronicle', path: '/wiki/heroic-chronicle' },
  { name: 'Classes', path: '/wiki/classes' },
  { name: 'Items', path: '/wiki/items' },
  { name: 'Equipments', path: '/wiki/equipments' },
  { name: 'Feats', path: '/wiki/feats' },
  { name: 'Racial Feats', path: '/wiki/racial-feats' },
  { name: 'Miscellaneous', path: '/wiki/miscellaneous' },
  { name: 'Monsters', path: '/wiki/monsters' },
  { name: 'Homebrew', path: '/wiki/homebrew' },
  { name: 'UA', path: '/wiki/ua' }
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
      </div>
    </div>
  );
};

export default Wiki;
