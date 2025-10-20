import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMonsterByIndex } from "../../Api";
import "../../assets/styles/WikiTheme.css";

export default function Monster() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [monster, setMonster] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonster = async () => {
      setLoading(true);
      try {
        const data = await getMonsterByIndex(index);
        setMonster(data);
      } catch {
        setMonster(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMonster();
  }, [index]);

  if (loading) return <div className="loading">Monster details loading...</div>;
  if (!monster) return <div className="error">Monster not found.</div>;

  const speed = monster.speed || {};
  const abilities = [
    { label: "STR", value: monster.strength },
    { label: "DEX", value: monster.dexterity },
    { label: "CON", value: monster.constitution },
    { label: "INT", value: monster.intelligence },
    { label: "WIS", value: monster.wisdom },
    { label: "CHA", value: monster.charisma },
  ];

  return (
    <div id="monster-comp" className="monster-page-container">
      <div className="monster-overlay">
        <button className="back-button" onClick={() => navigate("/wiki/monsters")}>
          ← Back to Monsters
        </button>

        <div className="monster-detail-card">
          <div className="monster-header">
            <h2>{monster.name}</h2>
            {monster.image ? (
              <img src={monster.image} alt={monster.name} className="monster-image" />
            ) : (
              <div className="no-image">No Image Available</div>
            )}
            <p className="monster-summary">
              The <b>{monster.name}</b> is a {monster.size || "Unknown"} {monster.type || ""} creature with {monster.alignment || "unknown"} alignment and challenge rating {monster.challenge_rating ?? "?"}.
            </p>
          </div>

          <div className="monster-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Armor Class</span>
                <p>{monster.armor_class?.[0]?.value ? `${monster.armor_class[0].value} (${monster.armor_class[0].type})` : "Unknown"}</p>
              </div>
              <div className="info-item">
                <span className="info-label">Hit Points</span>
                <p>{monster.hit_points} ({monster.hit_dice})</p>
              </div>
              <div className="info-item">
                <span className="info-label">Speed</span>
                <p>
                  {speed.walk ? `Walk ${speed.walk}` : ""}
                  {speed.fly ? `, Fly ${speed.fly}` : ""}
                  {speed.swim ? `, Swim ${speed.swim}` : ""}
                  {!speed.walk && !speed.fly && !speed.swim ? "Unknown" : ""}
                </p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Abilities</span>
              <p>{abilities.map(a => `${a.label} ${a.value ?? "-"}`).join(", ")}</p>
            </div>

            <div className="info-item">
              <span className="info-label">Languages</span>
              <p>{monster.languages || "None"}</p>
            </div>

            <div className="info-item">
              <span className="info-label">Special Abilities</span>
              {monster.special_abilities?.length ? (
                <ul>{monster.special_abilities.map((sa, i) => <li key={i}><b>{sa.name}</b>: {sa.desc}</li>)}</ul>
              ) : <p>None</p>}
            </div>

            <div className="info-item">
              <span className="info-label">Actions</span>
              {monster.actions?.length ? (
                <ul>{monster.actions.map((a, i) => <li key={i}><b>{a.name}</b>: {a.desc}</li>)}</ul>
              ) : <p>None</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
