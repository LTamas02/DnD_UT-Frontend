import React, { useEffect, useState } from 'react';
import { getAllAlignments } from '../../Api';
import '../../assets/styles/WikiTheme.css';
import {  useNavigate } from 'react-router-dom';


export default function AlignmentsWiki() {
  const [alignments, setAlignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState([]); // track expanded cards
  
    const navigate = useNavigate();

  useEffect(() => {
    const fetchAlignments = async () => {
      try {
        const data = await getAllAlignments();
        if (Array.isArray(data) && data.length > 0) {
          setAlignments(data);
        } else {
          setAlignments([]);
        }
      } catch (err) {
        console.error("Failed to fetch alignments:", err);
        setError("Failed to load alignments. Check API server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlignments();
  }, []);

  if (loading)
    return <div className="page-overlay loading">Loading alignments...</div>;

  if (error)
    return <div className="page-overlay error">{error}</div>;

  if (alignments.length === 0)
    return <p>No alignments found. Check API server status.</p>;

  const toggleCard = (index) => {
    if (expandedCards.includes(index)) {
      setExpandedCards(expandedCards.filter(i => i !== index));
    } else {
      setExpandedCards([...expandedCards, index]);
    }
  };

  return (
    <div id="alignments-wiki" className="page-comp">
      <div className="page-overlay">
        
                {/* Wax Seal stílusú vissza gomb */}
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back to Backgrounds List
                </button>
        <h1>Alignments</h1>
        <p>Browse all Dungeons & Dragons 5th Edition character alignments.</p>

        <div className="wiki-grid">
          {alignments.map(alignment => {
            const isOpen = expandedCards.includes(alignment.index);
            return (
              <div key={alignment.index} className="wiki-card">
                <div className="card-header" onClick={() => toggleCard(alignment.index)}>
                  <div>
                    <h2>{alignment.name}</h2>
                    {alignment.desc && <p>{alignment.desc}</p>}
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
