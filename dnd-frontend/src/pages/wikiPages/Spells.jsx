import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/WikiTheme.css';
import { getSpellsByLevel } from '../../assets/api/wikiapi';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';

const levels = [
  { label: 'Cantrip', value: 0 },
  { label: '1st Level', value: 1 },
  { label: '2nd Level', value: 2 },
  { label: '3rd Level', value: 3 },
  { label: '4th Level', value: 4 },
  { label: '5th Level', value: 5 },
  { label: '6th Level', value: 6 },
  { label: '7th Level', value: 7 },
  { label: '8th Level', value: 8 },
  { label: '9th Level', value: 9 },
];

const Spells = () => {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // useNavigate for routing
  const { saveNow } = useScrollRestoration({ ready: !loading });

  useEffect(() => {
    const fetchSpells = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getSpellsByLevel(selectedLevel);
        setSpells(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch spells. Please try again.');
        setSpells([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpells();
  }, [selectedLevel]);

  const handleSpellClick = (index) => {
    saveNow();
    navigate(`/spell/${index}`); // Navigate to spell detail page
  };

  return (
    <div id="spells-comp">
      
        <button className="back-button" onClick={() => navigate("/wiki")}>
          ← Back to Wiki page
        </button>
      <h1>Spells</h1>
      <p>Browse all the spells available in the game.</p>

      {/* Level selector */}
      <ul className="spell-levels">
        {levels.map((lvl) => (
          <li
            key={lvl.value}
            className={selectedLevel === lvl.value ? 'selected' : ''}
            onClick={() => setSelectedLevel(lvl.value)}
          >
            <em>{lvl.label}</em>
          </li>
        ))}
      </ul>

      {/* Spell table */}
      <div className="spells-table">
        {loading ? (
          <p style={{ color: 'var(--app-text, #f5deb3)', textAlign: 'center' }}>Loading spells...</p>
        ) : error ? (
          <p style={{ color: 'var(--app-text, #f5deb3)', textAlign: 'center' }}>{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Spell Name</th>
                <th>School</th>
                <th>Casting Time</th>
                <th>Range</th>
                <th>Duration</th>
                <th>Components</th>
              </tr>
            </thead>
            <tbody>
              {spells.length > 0 ? (
                spells.map((spell, index) => (
                  <tr
                    key={index}
                    onClick={() => handleSpellClick(spell.index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{spell.name}</td>
                    <td>{spell.school?.name}</td>
                    <td>{spell.castingTime ?? spell.casting_time}</td>
                    <td>{spell.range}</td>
                    <td>{spell.duration}</td>
                    <td>{spell.components?.join(', ')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--app-text, #f5deb3)' }}>
                    No spells of this level.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
      </div>
    </div>
  );
};

export default Spells;


