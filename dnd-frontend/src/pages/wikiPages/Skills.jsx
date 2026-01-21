// Skills.jsx (FIXED: ability_score field + working filters)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSkills, getSkillAbilityScores } from "../../Api"; // adjust path
import "../../assets/styles/WikiTheme.css";

const norm = (v) => (v ?? "").toString().trim().toLowerCase();

const getAbilityObj = (skill) =>
  skill?.ability_score ?? skill?.abilityScore ?? skill?.ability_Score ?? null;

const getAbilityName = (skill) => getAbilityObj(skill)?.name ?? "";
const getAbilityIndex = (skill) => getAbilityObj(skill)?.index ?? "";

export default function Skills() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [abilityNames, setAbilityNames] = useState([]); // e.g. ["CHA","CON",...]
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInDesc, setSearchInDesc] = useState(false);
  const [selectedAbilityName, setSelectedAbilityName] = useState(""); // e.g. "DEX"
  const [bucket, setBucket] = useState("All"); // All | Physical | Mental | Social

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [skillsRes, abilitiesRes] = await Promise.all([
          getAllSkills(),
          getSkillAbilityScores(),
        ]);

        const all = Array.isArray(skillsRes?.data) ? skillsRes.data : [];
        const abs = Array.isArray(abilitiesRes?.data) ? abilitiesRes.data : [];

        setSkills(all);
        setAbilityNames(abs);
        setSelected(all.length ? all[0] : null);
      } catch {
        setError("Error loading skills.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let list = skills;

    // Bucket filter (use ability INDEX for reliability: str/dex/con/int/wis/cha)
    if (bucket !== "All") {
      const abIndex = (s) => norm(getAbilityIndex(s));
      if (bucket === "Physical") {
        const allow = new Set(["str", "dex", "con"]);
        list = list.filter((s) => allow.has(abIndex(s)));
      } else if (bucket === "Mental") {
        const allow = new Set(["int", "wis"]);
        list = list.filter((s) => allow.has(abIndex(s)));
      } else if (bucket === "Social") {
        list = list.filter((s) => abIndex(s) === "cha");
      }
    }

    // Ability filter (dropdown uses ability NAME coming from /ability-scores)
    if (selectedAbilityName) {
      list = list.filter((s) => {
        const name = getAbilityName(s);
        return name === selectedAbilityName;
      });
    }

    // Search filter
    const q = norm(searchTerm);
    if (q) {
      list = list.filter((s) => {
        if (norm(s?.name).includes(q)) return true;

        if (searchInDesc && Array.isArray(s?.desc)) {
          return s.desc.some((d) => norm(d).includes(q));
        }
        return false;
      });
    }

    return list;
  }, [skills, bucket, selectedAbilityName, searchTerm, searchInDesc]);

  // keep selection valid after filtering
  useEffect(() => {
    if (!selected) {
      if (filtered.length) setSelected(filtered[0]);
      return;
    }
    const stillThere = filtered.some((s) => s.index === selected.index);
    if (!stillThere) setSelected(filtered.length ? filtered[0] : null);
  }, [filtered, selected]);

  if (loading)
    return (
      <div className="page-content">
        <div className="loading">Loading skills...</div>
      </div>
    );

  if (error)
    return (
      <div className="page-content">
        <div className="error">{error}</div>
      </div>
    );

  const selectedDesc = Array.isArray(selected?.desc) ? selected.desc : [];
  const selectedAbilityNameText = selected ? (getAbilityName(selected) || "-") : "-";

  return (
    <div id="skills-comp">
      <div
        id="skills-page"
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
          <h1>D&D Skills</h1>
          <p className="subtitle">Search and inspect skills</p>
        </header>

        <div
          className="search-section"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder={searchInDesc ? "Search name or description..." : "Search by skill name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: 0 }}
          />

          <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
            <option value="All">All</option>
            <option value="Physical">Physical (STR/DEX/CON)</option>
            <option value="Mental">Mental (INT/WIS)</option>
            <option value="Social">Social (CHA)</option>
          </select>

          <select value={selectedAbilityName} onChange={(e) => setSelectedAbilityName(e.target.value)}>
            <option value="">All Abilities</option>
            {abilityNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
            <input
              type="checkbox"
              checked={searchInDesc}
              onChange={(e) => setSearchInDesc(e.target.checked)}
            />
            Search in description
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 14,
            marginTop: 14,
            alignItems: "start",
          }}
        >
          {/* List: 2-up grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {filtered.length === 0 ? (
              <div className="error" style={{ gridColumn: "1 / -1" }}>
                No skills found.
              </div>
            ) : (
              filtered.map((s) => {
                const active = selected?.index === s.index;
                const abName = getAbilityName(s) || "—";
                const firstLine = Array.isArray(s?.desc) && s.desc.length ? s.desc[0] : "";

                return (
                  <div
                    key={s.index}
                    className="monster-card"
                    onClick={() => setSelected(s)}
                    style={{
                      cursor: "pointer",
                      outline: active ? "2px solid rgba(255,255,255,0.25)" : "none",
                    }}
                  >
                    <div className="monster-header">
                      <h3 className="monster-name">{s.name || "Unknown"}</h3>
                      <div className="monster-size-type">{abName}</div>
                      <div className="monster-alignment">{s.index || ""}</div>
                    </div>

                    <div className="monster-details">
                      {firstLine ? (
                        <div className="detail-item">
                          <span className="detail-label">Desc:</span>
                          <span className="detail-value">
                            {firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine}
                          </span>
                        </div>
                      ) : (
                        <div className="detail-item">
                          <span className="detail-label">Desc:</span>
                          <span className="detail-value">—</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Details */}
          <div className="monster-detail-card" style={{ position: "sticky", top: 16 }}>
            {!selected ? (
              <div className="error">Select a skill to view details.</div>
            ) : (
              <>
                <div className="monster-header">
                  <h2 style={{ marginBottom: 6 }}>{selected.name}</h2>
                  <p className="monster-summary" style={{ marginTop: 0 }}>
                    <b>{selected.name}</b> is tied to <b>{selectedAbilityNameText}</b>.
                  </p>
                </div>

                <div className="monster-info">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Index</span>
                      <p>{selected.index || "-"}</p>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Ability Score</span>
                      <p>{selectedAbilityNameText}</p>
                    </div>
                  </div>

                  {selectedDesc.length > 0 && (
                    <div className="info-item">
                      <span className="info-label">Description</span>
                      <ul>
                        {selectedDesc.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
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
              #skills-page > div[style*="grid-template-columns: 1.15fr 0.85fr"] {
                grid-template-columns: 1fr !important;
              }
              .monster-detail-card[style*="sticky"] {
                position: static !important;
              }
            }
            @media (max-width: 700px) {
              #skills-page div[style*="repeat(2"] {
                grid-template-columns: 1fr !important;
              }
              #skills-page .search-section {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}
