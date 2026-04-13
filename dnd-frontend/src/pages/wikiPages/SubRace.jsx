import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSubraceByIndex } from "../../assets/api/wikiapi";
import "../../assets/styles/WikiTheme.css";

const toLabel = (x) => {
  if (!x) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object") return x.name ?? x.index ?? x.url ?? "";
  return "";
};

export default function SubRace() {
  const { index, raceIndex, subraceIndex } = useParams();
  const navigate = useNavigate();

  const resolvedSubraceIndex = subraceIndex || index;
  const [subrace, setSubrace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubrace = async () => {
      if (!resolvedSubraceIndex) {
        setSubrace(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getSubraceByIndex(resolvedSubraceIndex);
        setSubrace(res?.data ?? null);
      } catch {
        setSubrace(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubrace();
  }, [resolvedSubraceIndex]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!subrace) return <div className="error">Subrace not found.</div>;

  return (
    <div id="subrace-comp" className="monster-page-container">
      <div className="monster-overlay">
        <button
          className="back-button"
          onClick={() => {
            const target = raceIndex || subrace?.race?.index;
            navigate(target ? `/race/${target}` : "/wiki/races");
          }}
        >
          {"<- Back to Race"}
        </button>

        <div className="monster-detail-card">
          <div className="monster-header">
            <h2>{subrace.name}</h2>
            <p className="monster-summary" style={{ marginTop: 6 }}>
              <b>{subrace.name}</b> is a subrace of <b>{subrace?.race?.name || "Unknown"}</b>.
            </p>
          </div>

          <div className="monster-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Race</span>
                <p>{subrace?.race?.name || "-"}</p>
              </div>
              <div className="info-item">
                <span className="info-label">Index</span>
                <p>{subrace.index || "-"}</p>
              </div>
            </div>

            {subrace.description && (
              <div className="info-item">
                <span className="info-label">Description</span>
                <p>{subrace.description}</p>
              </div>
            )}

            {Array.isArray(subrace.abilityBonuses) && subrace.abilityBonuses.length > 0 && (
              <div className="info-item">
                <span className="info-label">Ability Bonuses</span>
                <p>
                  {subrace.abilityBonuses
                    .map((b) => `${toLabel(b?.abilityScore)} +${b?.bonus ?? 0}`)
                    .join(", ")}
                </p>
              </div>
            )}

            {Array.isArray(subrace.racialTraits) && subrace.racialTraits.length > 0 && (
              <div className="info-item">
                <span className="info-label">Racial Traits</span>
                <ul>
                  {subrace.racialTraits.map((t) => (
                    <li key={t.index}>{toLabel(t)}</li>
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


