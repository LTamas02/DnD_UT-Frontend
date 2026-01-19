import { useEffect, useState } from "react";
import { getAllRaces, getRaceSizes, getRacesByMinSpeed, searchRacesByName } from "../../Api";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/WikiTheme.css";

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
    let filtered = await getAllRaces();
    if (searchTerm) {
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.size) filtered = filtered.filter(r => r.size === filters.size);
    if (filters.speed) filtered = filtered.filter(r => r.speed >= parseInt(filters.speed));
    setRaces(filtered);
  };

  const resetFilters = () => {
    setFilters({ size: "", speed: "" });
    setSearchTerm("");
    handleSearch();
  };

  if (loading) return <div className="loading">Loading races...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div id="races-comp">
      <div id="races-page">
        <button className="back-button" onClick={() => navigate("/wiki")}>
          ← Back to Main Page
        </button>
        <header>
          <h1>D&D Races</h1>
          <p className="subtitle">Explore the Dungeons & Dragons races</p>
        </header>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search by race name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch();
            }}
          />
          <select value={filters.size} onChange={e => {
            setFilters(f => ({ ...f, size: e.target.value }));
            handleSearch();
          }}>
            <option value="">All Sizes</option>
            {sizes.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
          <select value={filters.speed} onChange={e => {
            setFilters(f => ({ ...f, speed: e.target.value }));
            handleSearch();
          }}>
            <option value="">All Speeds</option>
            <option value="20">≤ 20 ft</option>
            <option value="25">25 ft</option>
            <option value="30">30 ft</option>
            <option value="35">≥ 35 ft</option>
          </select>
          <button onClick={resetFilters}>Reset</button>
        </div>

        <div className="races-grid">
          {races.length === 0 ? (
            <div className="error">No races found.</div>
          ) : (
            races.map(race => (
              <div key={race.index} className="race-card" onClick={() => navigate(`/race/${race.index}`)}>
                <div className="race-header" style={{ backgroundColor: "var(--app-border, #878787)" }}>
                  <h3 className="race-name">{race.name}</h3>
                  <div className="race-size">{race.size}</div>
                </div>
                <div className="race-details">
                  <div className="detail-item">
                    <span className="detail-label">Speed</span>
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
