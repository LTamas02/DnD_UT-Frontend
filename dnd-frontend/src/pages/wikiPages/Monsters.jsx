import { useEffect, useState } from "react";
import { getAllMonsters, searchMonstersByName } from "../../Api";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/Monsters.css";

export default function Monsters() {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllMonsters();
        setMonsters(data);
      } catch {
        setError("Error loading monsters.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) return;
    try {
      const results = await searchMonstersByName(searchTerm);
      setMonsters(results.monsters || []);
    } catch {
      setError("Error searching monsters.");
    }
  };

  if (loading) return <div className="page-content"><div className="loading">Loading monsters...</div></div>;
  if (error) return <div className="page-content"><div className="error">{error}</div></div>;

  return (
    <div id="monsters-comp">
      <div id="monsters-page" className="page-content">
        <header>
          <button className="back-button" onClick={() => navigate("/wiki")}>
            ← Back to Main Page
          </button>
          <h1>D&D Monsters</h1>
          <p className="subtitle">Explore the Dungeons & Dragons monsters</p>
        </header>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search by monster name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="monsters-grid">
          {monsters.length === 0 ? (
            <div className="error">No monsters found.</div>
          ) : (
            monsters.map((monster) => (
              <div key={monster.index} className="monster-card" onClick={() => navigate(`/monster/${monster.index}`)}>
                <div className="monster-header">
                  <h3 className="monster-name">{monster.name || "Unknown"}</h3>
                  <div className="monster-size-type">{monster.size || "Unknown"} {monster.type || ""}</div>
                  <div className="monster-alignment">{monster.alignment || "Unknown"}</div>
                </div>
                <div className="monster-details">
                  <div className="detail-item">
                    <span className="detail-label">CR:</span>
                    <span className="detail-value">{monster.challenge_rating ?? "Unknown"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AC:</span>
                    <span className="detail-value">{monster.armor_class?.[0]?.value ?? "Unknown"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">HP:</span>
                    <span className="detail-value">{monster.hit_points ?? "Unknown"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">XP:</span>
                    <span className="detail-value">{monster.xp ?? "Unknown"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
