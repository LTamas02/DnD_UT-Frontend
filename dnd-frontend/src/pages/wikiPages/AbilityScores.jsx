import React, { useEffect, useMemo, useState } from "react";
import { getAllAbilityScores } from "../../Api";
import "../../assets/styles/WikiTheme.css";
import { useNavigate } from "react-router-dom";

const toLabel = (x) => {
  if (!x) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object") return x.name ?? x.index ?? x.url ?? "";
  return "";
};

export default function AbilityScoresWiki() {
  const [abilityScores, setAbilityScores] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAbilityScores = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getAllAbilityScores(); // your function returns array directly
        const arr = Array.isArray(data) ? data : [];
        setAbilityScores(arr);
        setSelected(arr.length ? arr[0] : null);
      } catch (err) {
        console.error("Failed to fetch ability scores:", err);
        setError("Failed to load ability scores. Check API server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAbilityScores();
  }, []);

  const leftCards = useMemo(() => abilityScores || [], [abilityScores]);

  if (loading) return <div className="page-overlay loading">Loading ability scores...</div>;
  if (error) return <div className="page-overlay error">{error}</div>;
  if (!leftCards.length) return <p>No ability scores found. Check API server status.</p>;

  const skillsText =
    Array.isArray(selected?.skills) && selected.skills.length
      ? selected.skills.map((s) => toLabel(s)).filter(Boolean).join(", ")
      : "None";

  return (
    <div id="ability-scores-wiki" className="page-comp">
      <div className="page-overlay">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>

        <h1>Ability Scores</h1>
        <p>Browse all Dungeons & Dragons 5th Edition ability scores and their details.</p>

        {/* Two-column layout: list (left) + description/details (right) */}
        <div
          style={{
            maxWidth: 1100,
            width: "100%",
            margin: "0 auto",
            paddingLeft: 16,
            paddingRight: 16,
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* LEFT: 2-up cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {leftCards.map((score) => {
              const active = selected?.index === score.index;

              return (
                <div
                  key={score.index}
                  className="monster-card"
                  onClick={() => setSelected(score)}
                  style={{
                    cursor: "pointer",
                    outline: active ? "2px solid rgba(255,255,255,0.25)" : "none",
                  }}
                >
                  <div className="monster-header">
                    <h3 className="monster-name">{score.name}</h3>
                    <div className="monster-size-type">{score.full_name ? score.full_name : score.index}</div>
                    <div className="monster-alignment">{score.index}</div>
                  </div>

                  <div className="monster-details">
                    <div className="detail-item">
                      <span className="detail-label">Skills:</span>
                      <span className="detail-value">
                        {Array.isArray(score.skills) ? score.skills.length : 0}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Desc:</span>
                      <span className="detail-value">
                        {Array.isArray(score.desc) && score.desc.length
                          ? score.desc[0].length > 70
                            ? score.desc[0].slice(0, 70) + "..."
                            : score.desc[0]
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: details */}
          <div className="monster-detail-card" style={{ position: "sticky", top: 16 }}>
            {!selected ? (
              <div className="error">Select an ability score to view details.</div>
            ) : (
              <>
                <div className="monster-header">
                  <h2 style={{ marginBottom: 6 }}>{selected.name}</h2>
                  <p className="monster-summary" style={{ marginTop: 0 }}>
                    <b>{selected.name}</b>
                    {selected.full_name ? ` (${selected.full_name})` : ""} describes a core ability used for checks,
                    saving throws, and related skills.
                  </p>
                </div>

                <div className="monster-info">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Index</span>
                      <p>{selected.index}</p>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Full Name</span>
                      <p>{selected.full_name || "—"}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Description</span>
                    {Array.isArray(selected.desc) && selected.desc.length ? (
                      <ul>
                        {selected.desc.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>—</p>
                    )}
                  </div>

                  <div className="info-item">
                    <span className="info-label">Associated Skills</span>
                    <p>{skillsText}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <style>
          {`
            @media (max-width: 1050px) {
              #ability-scores-wiki .page-overlay > div[style*="grid-template-columns: 1.15fr 0.85fr"] {
                grid-template-columns: 1fr !important;
              }
              .monster-detail-card[style*="sticky"] {
                position: static !important;
              }
            }

            @media (max-width: 700px) {
              #ability-scores-wiki .page-overlay div[style*="repeat(2"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}
