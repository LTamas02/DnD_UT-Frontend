import React, { useEffect, useState } from 'react';
import { getAllAbilityScores } from '../../Api';
import '../../assets/styles/WikiTheme.css';
import {  useNavigate } from 'react-router-dom';


export default function AbilityScoresWiki() {
  const [abilityScores, setAbilityScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState([]); // track multiple expanded cards
  
    const navigate = useNavigate();

  useEffect(() => {
    const fetchAbilityScores = async () => {
      try {
        const data = await getAllAbilityScores();
        if (Array.isArray(data) && data.length > 0) {
          setAbilityScores(data);
        } else {
          setAbilityScores([]);
        }
      } catch (err) {
        console.error("Failed to fetch ability scores:", err);
        setError("Failed to load ability scores. Check API server.");
      } finally {
        setLoading(false);
      }
    };
    fetchAbilityScores();
  }, []);

  if (loading)
    return <div className="page-overlay loading">Loading ability scores...</div>;

  if (error)
    return <div className="page-overlay error">{error}</div>;

  if (abilityScores.length === 0)
    return <p>No ability scores found. Check API server status.</p>;

  const toggleCard = (index) => {
    if (expandedCards.includes(index)) {
      setExpandedCards(expandedCards.filter(i => i !== index));
    } else {
      setExpandedCards([...expandedCards, index]);
    }
  };

  return (
    <div id="ability-scores-wiki" className="page-comp">
      <div className="page-overlay">
        
                {/* Wax Seal stílusú vissza gomb */}
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back to Backgrounds List
                </button>
        <h1>Ability Scores</h1>
        <p>Browse all Dungeons & Dragons 5th Edition ability scores and their details.</p>

        <div className="wiki-grid">
          {abilityScores.map(score => {
            const isOpen = expandedCards.includes(score.index);
            return (
              <div key={score.index} className="wiki-card">
                <div className="card-header" onClick={() => toggleCard(score.index)}>
                  <div>
                    <h2>{score.name}</h2>
                    {score.full_name && <p><strong>Full Name:</strong> {score.full_name}</p>}
                  </div>
                  <button className="expand-btn">{isOpen ? '− Collapse' : '+ Expand'}</button>
                </div>

                <div className={`card-content ${isOpen ? 'open' : ''}`}>
                  {score.desc && score.desc.length > 0 && (
                    <div>
                      <strong>Description:</strong>
                      {score.desc.map((d, i) => <p key={i}>{d}</p>)}
                    </div>
                  )}
                  {score.skills && score.skills.length > 0 && (
                    <div>
                      <strong>Associated Skills:</strong>
                      <ul>
                        {score.skills.map(skill => (
                          <li key={skill.index}>{skill.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
