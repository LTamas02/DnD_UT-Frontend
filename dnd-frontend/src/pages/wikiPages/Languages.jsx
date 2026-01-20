import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllLanguages } from '../../Api';
import '../../assets/styles/WikiTheme.css';

export default function LanguagesWiki() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div id="languages-wiki" className="page-comp">
      <div className="page-overlay">
        <button onClick={() => navigate(-1)} className="back-button">
          Back to Languages List
        </button>

        <h1>Languages</h1>
        <p>Browse all Dungeons & Dragons 5th Edition languages.</p>

        <div className="wiki-grid">
          {languages.map(language => (
            <div key={language.index} className="wiki-card">
              <div className="card-header">
                <div>
                  <h2>{language.name}</h2>
                  {language.desc && <p>{language.desc}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
