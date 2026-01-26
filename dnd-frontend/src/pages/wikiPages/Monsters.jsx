import { useEffect, useState } from "react";
import { getAllMonsters } from "../../assets/api/wikiapi";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/WikiTheme.css";

export default function Monsters() {
  const [monsters, setMonsters] = useState([]);
  const [filteredMonsters, setFilteredMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCR, setFilterCR] = useState("All");
  const [filterHP, setFilterHP] = useState("All");
  const [filterXP, setFilterXP] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllMonsters();
        setMonsters(data);
        setFilteredMonsters(data);
      } catch {
        setError("Error loading monsters.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter monsters reactively
  useEffect(() => {
    let filtered = monsters;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by CR ranges
    if (filterCR !== "All") {
      const [minCR, maxCR] = filterCR.split("-").map(Number);
      filtered = filtered.filter(
        (m) =>
          m.challenge_rating !== undefined &&
          m.challenge_rating >= minCR &&
          m.challenge_rating <= maxCR
      );
    }


    // Filter by HP ranges
    if (filterHP !== "All") {
      const [minHP, maxHP] = filterHP.split("-").map(Number);
      filtered = filtered.filter(
        (m) =>
          m.hit_points !== undefined &&
          m.hit_points >= minHP &&
          m.hit_points <= maxHP
      );
    }

    // Filter by XP ranges
    if (filterXP !== "All") {
      const [minXP, maxXP] = filterXP.split("-").map(Number);
      filtered = filtered.filter(
        (m) => m.xp !== undefined && m.xp >= minXP && m.xp <= maxXP
      );
    }

    setFilteredMonsters(filtered);
  }, [searchTerm, filterCR, filterHP, filterXP, monsters]);

  if (loading)
    return (
      <div className="page-content">
        <div className="loading">Loading monsters...</div>
      </div>
    );
  if (error)
    return (
      <div className="page-content">
        <div className="error">{error}</div>
      </div>
    );

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
          />

          <select value={filterCR} onChange={(e) => setFilterCR(e.target.value)}>
            <option value="All">All CR</option>
            <option value="0-1">0-1</option>
            <option value="2-4">2-4</option>
            <option value="5-10">5-10</option>
            <option value="11-20">11-20</option>
            <option value="21-30">21-30</option>
          </select>


          <select value={filterHP} onChange={(e) => setFilterHP(e.target.value)}>
            <option value="All">All HP</option>
            <option value="0-20">0-20</option>
            <option value="21-50">21-50</option>
            <option value="51-100">51-100</option>
            <option value="101-200">101-200</option>
            <option value="201-500">201-500</option>
            <option value="501-1000">501-1000</option>
          </select>

          <select value={filterXP} onChange={(e) => setFilterXP(e.target.value)}>
            <option value="All">All XP</option>
            <option value="0-50">0-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="501-1000">501-1000</option>
            <option value="1001-5000">1001-5000</option>
          </select>
        </div>

        <div className="monsters-grid">
          {filteredMonsters.length === 0 ? (
            <div className="error">No monsters found.</div>
          ) : (
            filteredMonsters.map((monster) => (
              <div
                key={monster.index}
                className="monster-card"
                onClick={() => navigate(`/monster/${monster.index}`)}
              >
                <div className="monster-header">
                  <h3 className="monster-name">{monster.name || "Unknown"}</h3>
                  <div className="monster-size-type">
                    {monster.size || "Unknown"} {monster.type || ""}
                  </div>
                  <div className="monster-alignment">
                    {monster.alignment || "Unknown"}
                  </div>
                </div>
                <div className="monster-details">
                  <div className="detail-item">
                    <span className="detail-label">CR:</span>
                    <span className="detail-value">
                      {monster.challenge_rating ?? "Unknown"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AC:</span>
                    <span className="detail-value">
                      {monster.armor_class?.[0]?.value ?? "Unknown"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">HP:</span>
                    <span className="detail-value">
                      {monster.hit_points ?? "Unknown"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">XP:</span>
                    <span className="detail-value">
                      {monster.xp ?? "Unknown"}
                    </span>
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


