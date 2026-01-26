import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllConditions } from '../../assets/api/wikiapi';
import '../../assets/styles/WikiTheme.css';

export default function ConditionsWiki() {
  const navigate = useNavigate();
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const data = await getAllConditions();
        if (Array.isArray(data) && data.length > 0) {
          setConditions(data);
        } else {
          setConditions([]);
        }
      } catch (err) {
        console.error("Failed to fetch conditions:", err);
        setError("Failed to load conditions. Check API server.");
      } finally {
        setLoading(false);
      }
    };

    fetchConditions();
  }, []);

  if (loading)
    return <div className="page-overlay loading">Loading conditions...</div>;

  if (error)
    return <div className="page-overlay error">{error}</div>;

  if (conditions.length === 0)
    return <p>No conditions found. Check API server status.</p>;

  return (
    <div id="conditions-wiki" className="page-comp">
      <div className="page-overlay">
        <button onClick={() => navigate(-1)} className="back-button">
          Back to Conditions List
        </button>

        <h1>Conditions</h1>
        <p>Browse all Dungeons & Dragons 5th Edition conditions.</p>

        <div className="wiki-grid">
          {conditions.map(condition => (
            <div key={condition.index} className="wiki-card">
              <div className="card-header">
                <div>
                  <h2>{condition.name}</h2>
                  {condition.desc && <p>{condition.desc}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


