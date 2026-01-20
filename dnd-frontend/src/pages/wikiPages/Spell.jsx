import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { getSpellByIndex } from '../../Api';
import '../../assets/styles/WikiTheme.css';

const Spell = () => {
  const { index } = useParams();
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

  if (loading) return <p style={{ color: 'var(--app-text, #f5deb3)' }}>Loading spell...</p>;
  if (error) return <p style={{ color: 'var(--app-text, #f5deb3)' }}>{error}</p>;
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
        <p><strong>Casting Time:</strong> {spell.castingTime ?? spell.casting_time}</p>
        <p><strong>Range:</strong> {spell.range}</p>
        <p><strong>Duration:</strong> {spell.duration}</p>
        <p><strong>Components:</strong> {spell.components?.join(', ')}</p>

        {spell.material && (
          <p><strong>Material:</strong> {spell.material}</p>
        )}

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

        {/* ✅ Classes */}
        {spell.classes && spell.classes.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <strong>Available to Classes:</strong>
            <div className="spell-class-list">
              {spell.classes.map(cls => (
                <span key={cls.index} className="spell-class-badge">
                  {cls.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Subclasses */}
        {spell.subclasses && spell.subclasses.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <strong>Available to Subclasses:</strong>
            <div className="spell-class-list">
              {spell.subclasses.map(sub => (
                <span key={sub.index} className="spell-class-badge subclass">
                  {sub.name}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Spell;
