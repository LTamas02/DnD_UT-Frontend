import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllBackgrounds } from '../../Api';
import '../../assets/styles/WikiTheme.css';

export default function Backgrounds() {
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const data = await getAllBackgrounds();

        if (Array.isArray(data)) {
          setBackgrounds(data);
        } else {
          console.warn("API response was not a direct array:", data);
          setBackgrounds([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch backgrounds:", err);
        setError("Failed to load backgrounds. Check the API server status.");
        setLoading(false);
      }
    };

    fetchBackgrounds();
  }, []);

  if (loading) {
    return (
      <div className="page-comp">
        <div className="page-overlay loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-comp">
        <div className="page-overlay error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div id="backgrounds-comp" className="page-comp">
      <div id="backgrounds-page" className="page-overlay">

        {/* ✅ Back button */}
        <button className="back-button" onClick={() => navigate('/wiki')}>
          ← Back to Wiki
        </button>

        <h1>Backgrounds</h1>
        <p>
          Browse through the available Dungeons & Dragons 5th Edition character backgrounds.
        </p>

        {backgrounds.length === 0 ? (
          <div className="loading">
            No backgrounds found. Check the API server status and response structure.
          </div>
        ) : (
          <div className="wiki-grid">
            {backgrounds.map((background) => (
              <Link
                to={`/background/${background.index}`}
                key={background.index}
                className="wiki-card"
              >
                <h3>{background.name}</h3>
                <p>D&D 5th Edition Character Background.</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
