import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMagicSchools } from "../../Api"; // adjust path
import "../../assets/styles/WikiTheme.css";

const norm = (v) => (v ?? "").toString().trim().toLowerCase();

export default function MagicSchools() {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAllMagicSchools();
        const data = Array.isArray(res?.data) ? res.data : [];
        setSchools(data);
        setFilteredSchools(data);
      } catch {
        setError("Error loading magic schools.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = schools;

    if (searchTerm) {
      const q = norm(searchTerm);
      filtered = filtered.filter(
        (s) => norm(s?.name).includes(q) || norm(s?.index).includes(q)
      );
    }

    setFilteredSchools(filtered);
  }, [searchTerm, schools]);

  const cards = useMemo(() => filteredSchools || [], [filteredSchools]);

  if (loading)
    return (
      <div className="page-content">
        <div className="loading">Loading magic schools...</div>
      </div>
    );

  if (error)
    return (
      <div className="page-content">
        <div className="error">{error}</div>
      </div>
    );

  return (
    <div id="magicschools-comp">
      <div
        id="magicschools-page"
        className="page-content"
        style={{
          maxWidth: 1000,
          width: "100%",
          margin: "0 auto",
          paddingLeft: 16,
          paddingRight: 16,
          boxSizing: "border-box",
        }}
      >
        <header>
          <button className="back-button" onClick={() => navigate("/wiki")}>
            ← Back to Main Page
          </button>
          <h1>D&D Magic Schools</h1>
          <p className="subtitle">Browse the schools of magic</p>
        </header>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search by school name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div
          className="monsters-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          {cards.length === 0 ? (
            <div className="error">No magic schools found.</div>
          ) : (
            cards.map((school) => (
              <div
                key={school.index}
                className="monster-card"
                onClick={() => navigate(`/magic-school/${school.index}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="monster-header">
                  <h3 className="monster-name">{school.name || "Unknown"}</h3>
                  <div className="monster-size-type">{school.index || ""}</div>
                  {school?.desc && <div className="monster-alignment">{school.desc}</div>}
                </div>

                <div className="monster-details">
                  <div className="detail-item">
                    <span className="detail-label">Index:</span>
                    <span className="detail-value">{school.index || "-"}</span>
                  </div>

                  {/* Keep it light: show only 1–2 extra hints if present */}
                  {school?.level && (
                    <div className="detail-item">
                      <span className="detail-label">Level:</span>
                      <span className="detail-value">{school.level}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
