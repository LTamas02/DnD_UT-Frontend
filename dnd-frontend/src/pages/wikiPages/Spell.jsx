import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getSpellByIndex } from '../../Api';
import '../../assets/styles/Spells.css';

const Spell = () => {
  const { index } = useParams(); // Get spell ID from URL
  const navigate = useNavigate();
  const [spell, setSpell] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpell = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getSpellByIndex(index);
        setSpell(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch spell.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpell();
  }, [index]);

  if (loading) return <p style={{ color: '#f5deb3' }}>Loading spell...</p>;
  if (error) return <p style={{ color: '#f5deb3' }}>{error}</p>;
  if (!spell) return null;

  return (
    <div id="spell-detail" className="page-content">      
        
      <div className="spell-details">
        <button className="back-button" onClick={() => navigate("/wiki/spells")}>
          ← Back to spells
        </button>
      <h1>{spell.name}</h1>
      <p><strong>School:</strong> {spell.school?.name}</p>
      <p><strong>Level:</strong> {spell.level}</p>
      <p><strong>Casting Time:</strong> {spell.castingTime}</p>
      <p><strong>Range:</strong> {spell.range}</p>
      <p><strong>Duration:</strong> {spell.duration}</p>
      <p><strong>Components:</strong> {spell.components?.join(', ')}</p>
      {spell.material && <p><strong>Material:</strong> {spell.material}</p>}
      {spell.desc && (
        <div>
          <strong>Description:</strong>
          {spell.desc.map((d, i) => (
            <p key={i}>{d}</p>
          ))}
        </div>
      )}
      {spell.higherLevel && (
        <div>
          <strong>At Higher Levels:</strong>
          {spell.higherLevel.map((d, i) => (
            <p key={i}>{d}</p>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Spell;
