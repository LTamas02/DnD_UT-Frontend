import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDamageTypes } from '../../Api';
import '../../assets/styles/WikiTheme.css';

export default function DamageTypesWiki() {
  const navigate = useNavigate();
  const [damageTypes, setDamageTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState([]);

  useEffect(() => {
    const fetchDamageTypes = async () => {
      try {
        const data = await getAllDamageTypes();
        if (Array.isArray(data) && data.length > 0) {
          setDamageTypes(data);
        } else {
          setDamageTypes([]);
        }
      } catch (err) {
        console.error("Failed to fetch damage types:", err);
        setError("Failed to load damage types. Check API server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDamageTypes();
  }, []);

  if (loading)
    return <div className="page-overlay loading">Loading damage types...</div>;

  if (error)
    return <div className="page-overlay error">{error}</div>;

  if (damageTypes.length === 0)
    return <p>No damage types found. Check API server status.</p>;

  const toggleCard = (index) => {
    if (expandedCards.includes(index)) {
      setExpandedCards(expandedCards.filter(i => i !== index));
    } else {
      setExpandedCards([...expandedCards, index]);
    }
  };

  return (
    <div id="damage-types-wiki" className="page-comp">
      <div className="page-overlay">

        {/* Wax Seal Back Button */}
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Damage Types List
        </button>

        <h1>Damage Types</h1>
        <p>Browse all Dungeons & Dragons 5th Edition damage types.</p>

        <div className="wiki-grid">
          {damageTypes.map(type => {
            const isOpen = expandedCards.includes(type.index);
            return (
              <div key={type.index} className="wiki-card">
                <div className="card-header" onClick={() => toggleCard(type.index)}>
                  <div>
                    <h2>{type.name}</h2>
                    {type.desc && <p>{type.desc}</p>}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
