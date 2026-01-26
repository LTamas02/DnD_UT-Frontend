import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSubclassByIndex } from "../../assets/api/wikiapi";
import "../../assets/styles/WikiTheme.css";

const toLabel = (x) => {
  if (!x) return "";
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object") return x.name ?? x.index ?? x.url ?? "";
  return "";
};

export default function SubClass() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [subclass, setSubclass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubclass = async () => {
      setLoading(true);
      try {
        const res = await getSubclassByIndex(index);
        setSubclass(res?.data ?? null);
      } catch {
        setSubclass(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubclass();
  }, [index]);

  const spellsGrouped = useMemo(() => {
    if (!Array.isArray(subclass?.spells)) return [];
    return subclass.spells.map((s, i) => ({
      key: i,
      prereqs: Array.isArray(s?.prerequisites) ? s.prerequisites.map(toLabel).filter(Boolean) : [],
      spell: toLabel(s?.spell),
    }));
  }, [subclass]);

  if (loading) return <div className="loading">Loading subclass...</div>;
  if (!subclass) return <div className="error">Subclass not found.</div>;

  return (
    <div id="subclass-comp" className="monster-page-container">
      <div className="monster-overlay">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="monster-detail-card">
          <div className="monster-header">
            <h2>{subclass.name}</h2>
            <p className="monster-summary" style={{ marginTop: 6 }}>
              <b>{subclass.name}</b> is a {subclass.subclassFlavor || "subclass"} for{" "}
              <b>{subclass?.class?.name || "Unknown Class"}</b>.
            </p>
          </div>

          <div className="monster-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Class</span>
                <p>{subclass?.class?.name || "-"}</p>
              </div>
              <div className="info-item">
                <span className="info-label">Flavor</span>
                <p>{subclass.subclassFlavor || "-"}</p>
              </div>
            </div>

            {Array.isArray(subclass.description) && subclass.description.length > 0 && (
              <div className="info-item">
                <span className="info-label">Description</span>
                <ul>
                  {subclass.description.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {spellsGrouped.length > 0 && (
              <div className="info-item">
                <span className="info-label">Subclass Spells</span>
                <ul>
                  {spellsGrouped.map((row) => (
                    <li key={row.key}>
                      <b>{row.spell}</b>
                      {row.prereqs.length > 0 ? ` — ${row.prereqs.join(", ")}` : ""}
                    </li>
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


