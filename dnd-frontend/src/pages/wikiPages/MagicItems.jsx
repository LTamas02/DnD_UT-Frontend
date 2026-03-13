// MagicItems.jsx (narrower layout, not full-width)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllMagicItems,
  getMagicItemCategories,
  getMagicItemRarities,
} from "../../assets/api/wikiapi"; // adjust path
import "../../assets/styles/WikiTheme.css";
import { useScrollRestoration } from "../../hooks/useScrollRestoration";

const norm = (v) => (v ?? "").toString().trim().toLowerCase();

const getCategory = (item) => item?.equipmentCategory ?? item?.equipment_category ?? null;
const getCategoryName = (item) => getCategory(item)?.name ?? "";
const getCategoryIndex = (item) => getCategory(item)?.index ?? "";
const getRarityName = (item) => item?.rarity?.name ?? "";

const requiresAttunement = (item) =>
  Array.isArray(item?.desc) &&
  item.desc.some((d) => norm(d).includes("requires attunement"));

const isCursed = (item) =>
  Array.isArray(item?.desc) &&
  item.desc.some((d) => norm(d).includes("curse"));

export default function MagicItems() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]); // strings
  const [rarities, setRarities] = useState([]); // strings

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // name string
  const [selectedRarity, setSelectedRarity] = useState(""); // name string
  const [filterTag, setFilterTag] = useState("All"); // All | Attunement | Cursed
  const { saveNow } = useScrollRestoration({ ready: !loading });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [itemsRes, catRes, rarRes] = await Promise.all([
          getAllMagicItems(),
          getMagicItemCategories(),
          getMagicItemRarities(),
        ]);

        setItems(Array.isArray(itemsRes?.data) ? itemsRes.data : []);
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
        setRarities(Array.isArray(rarRes?.data) ? rarRes.data : []);
      } catch {
        setError("Error loading magic items.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items;

    const q = norm(searchTerm);
    if (q) filtered = filtered.filter((i) => norm(i?.name).includes(q));

    const cat = norm(selectedCategory);
    if (cat) {
      filtered = filtered.filter((i) => {
        const n = norm(getCategoryName(i));
        const idx = norm(getCategoryIndex(i));
        return n === cat || idx === cat;
      });
    }

    const rar = norm(selectedRarity);
    if (rar) filtered = filtered.filter((i) => norm(getRarityName(i)) === rar);

    if (filterTag === "Attunement") filtered = filtered.filter(requiresAttunement);
    if (filterTag === "Cursed") filtered = filtered.filter(isCursed);

    return filtered;
  }, [items, searchTerm, selectedCategory, selectedRarity, filterTag]);

  if (loading)
    return (
      <div className="page-content">
        <div className="loading">Loading magic items...</div>
      </div>
    );

  if (error)
    return (
      <div className="page-content">
        <div className="error">{error}</div>
      </div>
    );

  return (
    <div id="magicitems-comp">
      {/* Constrain width without touching your global CSS */}
      <div
        id="magicitems-page"
        className="page-content"
        style={{
          maxWidth: 1100, // adjust to taste (900–1200 typically)
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
          <h1>D&D Magic Items</h1>
          <p className="subtitle">Explore the Dungeons & Dragons magic items</p>
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
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: 0 }}
          />

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)}>
            <option value="">All Rarities</option>
            {rarities.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
            <option value="All">All</option>
            <option value="Attunement">Requires Attunement</option>
            <option value="Cursed">Cursed</option>
          </select>
        </div>

        {/* Make cards wrap nicely in a narrower container */}
        <div
          className="monsters-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginTop: 14,
          }}
        >
          {filteredItems.length === 0 ? (
            <div className="error">No magic items found.</div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.index}
                className="monster-card"
                onClick={() => {
                  saveNow();
                  navigate(`/magic-item/${item.index}`);
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="monster-header">
                  <h3 className="monster-name">{item.name || "Unknown"}</h3>

                  <div className="monster-size-type">
                    {getCategoryName(item) || "Unknown Category"}
                  </div>

                  <div className="monster-alignment">
                    {getRarityName(item) || "Unknown Rarity"}
                  </div>
                </div>

                <div className="monster-details">
                  <div className="detail-item">
                    <span className="detail-label">Attunement:</span>
                    <span className="detail-value">{requiresAttunement(item) ? "Yes" : "No"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cursed:</span>
                    <span className="detail-value">{isCursed(item) ? "Yes" : "No"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Variants:</span>
                    <span className="detail-value">{item?.variants?.length ? item.variants.length : 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Optional: responsive tweak without editing CSS files */}
        <style>
          {`
            @media (max-width: 900px) {
              #magicitems-page .search-section {
                grid-template-columns: 1fr !important;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}


