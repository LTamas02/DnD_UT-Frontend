import React, { useEffect, useState } from 'react';
import { getAllLanguages } from '../../Api';
import '../../assets/styles/WikiTheme.css';
import { useNavigate } from 'react-router-dom';

export default function LanguagesWiki() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState([]); // track expanded cards
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await getAllLanguages();
        if (Array.isArray(data) && data.length > 0) {
          setLanguages(data);
        } else {
          setLanguages([]);
        }
      } catch (err) {
        console.error("Failed to fetch languages:", err);
        setError("Failed to load languages. Check API server.");
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  if (loading)
    return <div className="page-overlay loading">Loading languages...</div>;

  if (error)
    return <div className="page-overlay error">{error}</div>;

  if (languages.length === 0)
    return <p>No languages found. Check API server status.</p>;

  const toggleCard = (index) => {
    if (expandedCards.includes(index)) {
      setExpandedCards(expandedCards.filter(i => i !== index));
    } else {
      setExpandedCards([...expandedCards, index]);
    }
  };

  return (
    <div id="languages-wiki" className="page-comp">
      <div className="page-overlay">
        {/* Wax Seal Back Button */}
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Backgrounds List
        </button>

        <h1>Languages</h1>
        <p>Browse all Dungeons & Dragons 5th Edition languages and their details.</p>

        <div className="wiki-grid">
          {languages.map(lang => {
            const isOpen = expandedCards.includes(lang.index);
            return (
              <div key={lang.index} className="wiki-card">
                <div className="card-header" onClick={() => toggleCard(lang.index)}>
                  <h2>{lang.name}</h2>
                </div>

                
                  <div className="card-body">
                    {lang.desc && (
                      Array.isArray(lang.desc)
                        ? lang.desc.map((d, i) => <p key={i}>{d}</p>)
                        : <p>{lang.desc}</p>
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
