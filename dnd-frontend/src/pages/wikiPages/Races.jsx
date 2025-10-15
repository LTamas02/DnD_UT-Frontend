import { useEffect, useState } from "react";
import { getAllRaces, getRaceSizes, getRacesByMinSpeed, searchRacesByName } from "../../Api";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/Races.css"; // We'll reuse your CSS, slightly modified for React

export default function Races() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sizes, setSizes] = useState([]);
  const [filters, setFilters] = useState({ size: "", speed: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllRaces();
        setRaces(data);
        const sizeOptions = await getRaceSizes();
        setSizes(sizeOptions);
      } catch {
        setError("Error loading races.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) return applyFilters();
    try {
      const results = await searchRacesByName(searchTerm);
      setRaces(results);
    } catch {
      setError("Error searching races.");
    }
  };

  const applyFilters = async () => {
    let filtered = await getAllRaces();
    if (filters.size) filtered = filtered.filter(r => r.size === filters.size);
    if (filters.speed) filtered = filtered.filter(r => r.speed >= parseInt(filters.speed));
    setRaces(filtered);
  };

  const resetFilters = () => {
    setFilters({ size: "", speed: "" });
    setSearchTerm("");
    applyFilters();
  };

  if (loading) return <div className="page-content"><div className="loading">Loading races...</div></div>;
  if (error) return <div className="page-content"><div className="error">{error}</div></div>;

  return (
    <div id="races-comp">
    <div id="races-page" className="page-content">
      <header>
        <button className="back-button" onClick={() => navigate("/wiki")}>
          ← Back to Main Page
        </button>
        <h1>D&D Races</h1>
        <p className="subtitle">Explore the Dungeons & Dragons races</p>
      </header>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by race name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="filters">
        <select value={filters.size} onChange={e => setFilters(f => ({ ...f, size: e.target.value }))}>
          <option value="">Filter by size</option>
          {sizes.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
        <select value={filters.speed} onChange={e => setFilters(f => ({ ...f, speed: e.target.value }))}>
          <option value="">Filter by speed</option>
          <option value="20">20 ft or less</option>
          <option value="25">25 ft</option>
          <option value="30">30 ft</option>
          <option value="35">35 ft or more</option>
        </select>
        <button onClick={resetFilters}>Reset Filters</button>
      </div>

      <div className="races-grid">
        {races.length === 0 ? (
          <div className="error">No races found.</div>
        ) : (
          races.map((race) => (
            <div key={race.index} className="race-card" onClick={() => navigate(`/race/${race.index}`)}>
              <div className="race-header">
                <h3 className="race-name">{race.name}</h3>
                <div className="race-size">{race.size}</div>
              </div>
              <div className="race-details">
                <div className="detail-item">
                  <span className="detail-label">Speed:</span>
                  <span className="detail-value">{race.speed} ft</span>
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
