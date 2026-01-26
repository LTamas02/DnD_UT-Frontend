import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMagicSchoolByIndex } from "../../assets/api/wikiapi"; // adjust path
import "../../assets/styles/WikiTheme.css";

export default function MagicSchool() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      setLoading(true);
      try {
        const res = await getMagicSchoolByIndex(index);
        setSchool(res?.data ?? null);
      } catch {
        setSchool(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [index]);

  if (loading) return <div className="loading">Magic school details loading...</div>;
  if (!school) return <div className="error">Magic school not found.</div>;

  return (
    <div id="magicschool-comp" className="monster-page-container">
      <div className="monster-overlay">
        <button className="back-button" onClick={() => navigate("/wiki/magic-schools")}>
          ← Back to Magic Schools
        </button>

        <div className="monster-detail-card">
          <div className="monster-header">
            <h2>{school.name || "Unknown School"}</h2>

            <p className="monster-summary">
              The <b>{school.name}</b> school of magic ({school.index}) focuses on{" "}
              {school.desc ? school.desc : "a distinct magical discipline"}.
            </p>
          </div>

          <div className="monster-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Index</span>
                <p>{school.index || "-"}</p>
              </div>

              {/* If your JSON includes a common “name/desc” only, these blocks gracefully disappear */}
              {school?.source && (
                <div className="info-item">
                  <span className="info-label">Source</span>
                  <p>{school.source}</p>
                </div>
              )}
            </div>

            {school?.desc && (
              <div className="info-item">
                <span className="info-label">Description</span>
                <p>{school.desc}</p>
              </div>
            )}

            {/* If the JSON uses a different property like "features" or "spells", this stays quiet */}
            {Array.isArray(school?.features) && school.features.length > 0 && (
              <div className="info-item">
                <span className="info-label">Features</span>
                <ul>
                  {school.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


