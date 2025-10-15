import React from 'react';
import { Link } from 'react-router-dom'; // <-- import Link
import '../assets/styles/Navbar.css';
import '../assets/styles/Wiki.css';

const wikiSections = [
  { name: 'Spells', path: '/wiki/spells' },
  { name: 'Races', path: '/wiki/races' },
  { name: 'Backgrounds', path: '/wiki/backgrounds' },
  { name: 'Heroic Chronicle', path: '/wiki/heroic-chronicle' },
  { name: 'Classes', path: '/wiki/classes' },
  { name: 'Items', path: '/wiki/items' },
  { name: 'Feats', path: '/wiki/feats' },
  { name: 'Racial Feats', path: '/wiki/racial-feats' },
  { name: 'Miscellaneous', path: '/wiki/miscellaneous' },  
  { name: 'Monsters', path: '/wiki/monsters' },
  { name: 'Homebrew', path: '/wiki/homebrew' },
  { name: 'UA', path: '/wiki/ua' }
];

const Wiki = () => {
  return (
    <div id="wiki-comp" className="wiki-container">
      <div className="wiki-overlay">
        <h1>Wiki</h1>
        <p>Explore the different sections of the game wiki below:</p>
        <ul className="wiki-list">
          {wikiSections.map((section, index) => (
            <li key={index} className="wiki-item">
              {/* Use Link for React Router navigation */}
              <Link to={section.path}>
                {section.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Wiki;
