import { useEffect, useMemo, useState } from "react";
import { getAllRaces, getRaceSizes } from "../../assets/api/wikiapi";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/WikiTheme.css";
import { useScrollRestoration } from "../../hooks/useScrollRestoration";

const norm = (v) => (v ?? "").toString().trim().toLowerCase();

export default function Races() {
  const [allRaces, setAllRaces] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ size: "", speed: "" }); // speed is min speed number as string

  const navigate = useNavigate();
  const { saveNow } = useScrollRestoration({ ready: !loading });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAllRaces();
        setAllRaces(Array.isArray(data) ? data : []);

        const sizeOptions = await getRaceSizes();
        setSizes(Array.isArray(sizeOptions) ? sizeOptions : []);
      } catch {
        setError("Error loading races.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRaces = useMemo(() => {
    let list = allRaces;

    const q = norm(searchTerm);
    if (q) {
      list = list.filter((r) => norm(r?.name).includes(q));
    }

    if (filters.size) {
      list = list.filter((r) => r?.size === filters.size);
    }

    if (filters.speed) {
      const minSpeed = Number(filters.speed);
      list = list.filter((r) => Number(r?.speed ?? 0) >= minSpeed);
    }

    return list;
  }, [allRaces, searchTerm, filters.size, filters.speed]);

  const resetFilters = () => {
    setFilters({ size: "", speed: "" });
    setSearchTerm("");
  };

  if (loading) return <div className="loading">Loading races...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div id="races-comp">
      <div id="races-page" className="page-content" style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={filters.size}
            onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))}
          >
            <option value="">All Sizes</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          {/* speed = MIN speed filter */}
          <select
            value={filters.speed}
            onChange={(e) => setFilters((f) => ({ ...f, speed: e.target.value }))}
          >
            <option value="">All Speeds</option>
            <option value="20">20+ ft</option>
            <option value="25">25+ ft</option>
            <option value="30">30+ ft</option>
            <option value="35">35+ ft</option>
          </select>

          <button onClick={resetFilters}>Reset</button>
        </div>

        <div className="races-grid">
          {filteredRaces.length === 0 ? (
            <div className="error">No races found.</div>
          ) : (
            filteredRaces.map((race) => (
              <div
                key={race.index}
                className="race-card"
                onClick={() => {
                  saveNow();
                  navigate(`/race/${race.index}`);
                }}
                style={{ cursor: "pointer" }}
              >
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


