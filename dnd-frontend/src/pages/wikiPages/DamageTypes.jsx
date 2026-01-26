import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDamageTypes } from '../../assets/api/wikiapi';
import '../../assets/styles/WikiTheme.css';

export default function DamageTypesWiki() {
  const navigate = useNavigate();
  const [damageTypes, setDamageTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div id="damage-types-wiki" className="page-comp">
      <div className="page-overlay">
        <button onClick={() => navigate(-1)} className="back-button">
          Back to Damage Types List
        </button>

        <h1>Damage Types</h1>
        <p>Browse all Dungeons & Dragons 5th Edition damage types.</p>

        <div className="wiki-grid">
          {damageTypes.map(damage => (
            <div key={damage.index} className="wiki-card">
              <div className="card-header">
                <div>
                  <h2>{damage.name}</h2>
                  {damage.desc && <p>{damage.desc}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


