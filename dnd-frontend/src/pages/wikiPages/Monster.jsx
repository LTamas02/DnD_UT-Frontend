import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMonsterByIndex } from "../../Api";
import "../../assets/styles/Monster.css";

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

  return (
    <div id="monster-comp">
      <div id="monster-page">
        <button className="back-button" onClick={() => navigate("/wiki/monsters")}>
          ← Back to Monsters
        </button>

        <main>
          <div className="monster-detail-card">
            <div className="monster-header">
              <h2>{monster.Name}</h2>
              {monster.Image ? <img src={monster.Image} alt={monster.Name} className="monster-image" /> : null}
              <p>
                The {monster.Name} is a {monster.Size} {monster.Type || ""} with {monster.Alignment || "unknown"} alignment and CR {monster.ChallengeRating ?? "unknown"}.
              </p>
            </div>

            <div className="monster-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Size</span>
                  <p>{monster.Size}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">Type</span>
                  <p>{monster.Type || "Unknown"}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">Alignment</span>
                  <p>{monster.Alignment || "Unknown"}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">CR</span>
                  <p>{monster.ChallengeRating ?? "Unknown"}</p>
                </div>
              </div>

              <div className="info-item">
                <span className="info-label">Hit Points</span>
                <p>{monster.HitPoints ?? "Unknown"} ({monster.HitDice || "Unknown"})</p>
              </div>

              <div className="info-item">
                <span className="info-label">Speed</span>
                <p>
                  {monster.Speed?.Walk ? `Walk ${monster.Speed.Walk}` : ""}
                  {monster.Speed?.Fly ? `, Fly ${monster.Speed.Fly}` : ""}
                  {monster.Speed?.Swim ? `, Swim ${monster.Speed.Swim}` : ""}
                </p>
              </div>

              <div className="info-item">
                <span className="info-label">Abilities</span>
                <p>
                  STR {monster.Strength ?? "-"}, DEX {monster.Dexterity ?? "-"}, CON {monster.Constitution ?? "-"}, INT {monster.Intelligence ?? "-"}, WIS {monster.Wisdom ?? "-"}, CHA {monster.Charisma ?? "-"}
                </p>
              </div>

              <div className="info-item">
                <span className="info-label">Special Abilities</span>
                <ul>
                  {monster.SpecialAbilities?.length
                    ? monster.SpecialAbilities.map((sa, i) => <li key={i}>{sa.Name}: {sa.Desc}</li>)
                    : "None"}
                </ul>
              </div>

              <div className="info-item">
                <span className="info-label">Actions</span>
                <ul>
                  {monster.Actions?.length
                    ? monster.Actions.map((a, i) => <li key={i}>{a.Name}: {a.Desc}</li>)
                    : "None"}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
