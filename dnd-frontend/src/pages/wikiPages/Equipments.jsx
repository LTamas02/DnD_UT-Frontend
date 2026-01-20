import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllItems, getItemCategories } from "../../Api"; // adjust path
import "../../assets/styles/WikiTheme.css";

export default function Equipments() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const allItems = await getAllItems();
      setItems(allItems);
      setFilteredItems(allItems);
      const cats = await getItemCategories();
      setCategories(cats);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Live filtering
  useEffect(() => {
    let results = items;
    if (searchTerm) {
      results = results.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      results = results.filter(
        (item) =>
          item.equipment_category && item.equipment_category.index === selectedCategory
      );
    }
    setFilteredItems(results);
  }, [searchTerm, selectedCategory, items]);

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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.index} value={cat.index}>
                {cat.name}
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
                      {typeof item.armor_class === "object"
                        ? item.armor_class.base
                        : item.armor_class}
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
