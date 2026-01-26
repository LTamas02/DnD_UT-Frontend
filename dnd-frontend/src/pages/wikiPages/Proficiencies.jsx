// Proficiencies.jsx (single-page, list shows 2 cards per row on desktop)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllProficiencies, getProficiencyCategories } from "../../assets/api/wikiapi"; // adjust path
import "../../assets/styles/WikiTheme.css";

const norm = (v) => (v ?? "").toString().trim().toLowerCase();

const toLabel = (x) => {
  if (!x) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object") return x.name ?? x.index ?? x.url ?? "";
  return "";
};

const joinLabels = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr.map(toLabel).filter(Boolean).join(", ");
};

export default function Proficiencies() {
  const navigate = useNavigate();

  const [proficiencies, setProficiencies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [allRes, catsRes] = await Promise.all([
          getAllProficiencies(),
          getProficiencyCategories(),
        ]);

        const all = Array.isArray(allRes?.data) ? allRes.data : [];
        const cats = Array.isArray(catsRes?.data) ? catsRes.data : [];

        setProficiencies(all);
        setCategories(cats);
        setSelected(all.length ? all[0] : null);
      } catch {
        setError("Error loading proficiencies.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = proficiencies;

    const q = norm(searchTerm);
    if (q) {
      list = list.filter((p) => norm(p?.name).includes(q) || norm(p?.index).includes(q));
    }

    const t = norm(selectedType);
    if (t) {
      list = list.filter((p) => norm(p?.type) === t);
    }

    return list;
  }, [proficiencies, searchTerm, selectedType]);

  useEffect(() => {
    if (!selected) {
      if (filtered.length) setSelected(filtered[0]);
      return;
    }
    const stillThere = filtered.some((p) => p.index === selected.index);
    if (!stillThere) setSelected(filtered.length ? filtered[0] : null);
  }, [filtered, selected]);

  if (loading)
    return (
      <div className="page-content">
        <div className="loading">Loading proficiencies...</div>
      </div>
    );

  if (error)
    return (
      <div className="page-content">
        <div className="error">{error}</div>
      </div>
    );

  return (
    <div id="proficiencies-comp">
      <div
        id="proficiencies-page"
        className="page-content"
        style={{
          maxWidth: 1100,
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
          <h1>D&D Proficiencies</h1>
          <p className="subtitle">Search and inspect proficiencies</p>
        </header>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search by proficiency name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">All Types</option>
            {categories.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Page layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 14,
            marginTop: 14,
            alignItems: "start",
          }}
        >
          {/* LIST: now 2-up grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {filtered.length === 0 ? (
              <div className="error" style={{ gridColumn: "1 / -1" }}>
                No proficiencies found.
              </div>
            ) : (
              filtered.map((p) => {
                const active = selected?.index === p.index;
                return (
                  <div
                    key={p.index}
                    className="monster-card"
                    onClick={() => setSelected(p)}
                    style={{
                      cursor: "pointer",
                      outline: active ? "2px solid rgba(255,255,255,0.25)" : "none",
                    }}
                  >
                    <div className="monster-header">
                      <h3 className="monster-name">{toLabel(p.name) || "Unknown"}</h3>
                      <div className="monster-size-type">{toLabel(p.type) || "Unknown Type"}</div>
                      <div className="monster-alignment">{toLabel(p.index) || ""}</div>
                    </div>

                    <div className="monster-details">
                      <div className="detail-item">
                        <span className="detail-label">Classes:</span>
                        <span className="detail-value">
                          {Array.isArray(p?.classes) ? p.classes.length : 0}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Races:</span>
                        <span className="detail-value">
                          {Array.isArray(p?.races) ? p.races.length : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DETAILS */}
          <div className="monster-detail-card" style={{ position: "sticky", top: 16 }}>
            {!selected ? (
              <div className="error">Select a proficiency to view details.</div>
            ) : (
              <>
                <div className="monster-header">
                  <h2 style={{ marginBottom: 6 }}>{toLabel(selected.name) || "Unknown Proficiency"}</h2>
                  <p className="monster-summary" style={{ marginTop: 0 }}>
                    <b>{toLabel(selected.name)}</b> is a proficiency of type{" "}
                    <b>{toLabel(selected.type) || "unknown"}</b>.
                  </p>
                </div>

                <div className="monster-info">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Index</span>
                      <p>{toLabel(selected.index) || "-"}</p>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type</span>
                      <p>{toLabel(selected.type) || "-"}</p>
                    </div>
                  </div>

                  {Array.isArray(selected?.classes) && selected.classes.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Classes</span>
                      <p>{joinLabels(selected.classes)}</p>
                    </div>
                  )}

                  {Array.isArray(selected?.races) && selected.races.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Races</span>
                      <p>{joinLabels(selected.races)}</p>
                    </div>
                  )}

                  {selected?.reference && (
                    <div className="info-item">
                      <span className="info-label">Reference</span>
                      <p>{toLabel(selected.reference)}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <style>
          {`
            @media (max-width: 1050px) {
              /* page becomes stacked */
              #proficiencies-page > div[style*="grid-template-columns: 1.15fr 0.85fr"] {
                grid-template-columns: 1fr !important;
              }
              .monster-detail-card[style*="sticky"] {
                position: static !important;
              }
            }

            @media (max-width: 700px) {
              /* list becomes 1 column */
              #proficiencies-page div[style*="repeat(2"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}


