import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllItems, getItemCategories } from "../../Api";
import "../../assets/styles/WikiTheme.css";

export default function Equipments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [rawCategories, setRawCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(""); // will store value

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const allItems = await getAllItems();
      setItems(allItems || []);
      const cats = await getItemCategories();
      setRawCategories(cats || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Normalize categories to { value, label }
  const categories = useMemo(() => {
    return (rawCategories || [])
      .map((c) => {
        // Some APIs return: [{ index, name }], others return: ["Armor", "Weapon"], etc.
        if (typeof c === "string") return { value: c, label: c };
        if (c && typeof c === "object") {
          const value = c.index ?? c.name ?? "";
          const label = c.name ?? c.index ?? "";
          return value ? { value, label } : null;
        }
        return null;
      })
      .filter(Boolean);
  }, [rawCategories]);

  const filteredItems = useMemo(() => {
    let results = items || [];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      results = results.filter((item) => item?.name?.toLowerCase().includes(q));
    }

    if (selectedCategory) {
      results = results.filter((item) => {
        const ec = item?.equipment_category; // equipment endpoint often uses snake_case
        const idx = ec?.index ?? ec?.name ?? "";
        const name = ec?.name ?? "";
        // Allow matching by either index or name (covers both dropdown data types)
        return (
          idx?.toLowerCase() === selectedCategory.toLowerCase() ||
          name?.toLowerCase() === selectedCategory.toLowerCase()
        );
      });
    }

    return results;
  }, [items, searchTerm, selectedCategory]);

  return (
    <div id="equipments-comp" className="page-comp">
      <div className="page-overlay">
        <button className="back-button" onClick={() => navigate("/wiki")}>
          Back to Wiki
        </button>

        <header className="page-header">
          <h1>Equipments</h1>
          <p>Dungeons & Dragons Equipment Collection</p>
        </header>

        <div className="search-section">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading equipments...</div>
        ) : filteredItems.length === 0 ? (
          <div className="loading">No equipments found.</div>
        ) : (
          <div className="equipments-grid">
            {filteredItems.map((item) => (
              <div key={item.index} className="equipment-card">
                <div className="equipment-header">
                  <h3>{item.name}</h3>
                  <p>{item.equipment_category?.name || "Unknown Category"}</p>
                </div>
                <div className="equipment-body">
                  {item.weapon_category && <p>Weapon Type: {item.weapon_category}</p>}
                  {item.armor_class && (
                    <p>
                      Armor Class:{" "}
                      {typeof item.armor_class === "object" ? item.armor_class.base : item.armor_class}
                    </p>
                  )}
                  {item.weight !== undefined && <p>Weight: {item.weight}</p>}
                  {item.cost && <p>Price: {item.cost.quantity} {item.cost.unit}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
