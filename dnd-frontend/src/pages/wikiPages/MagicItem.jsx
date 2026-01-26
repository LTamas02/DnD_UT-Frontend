import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMagicItemByIndex, getMagicItemVariants } from "../../assets/api/wikiapi"; // adjust path
import "../../assets/styles/WikiTheme.css";

const norm = (v) => (v ?? "").toString().trim().toLowerCase();
const getCategory = (item) => item?.equipmentCategory ?? item?.equipment_category ?? null;
const getCategoryName = (item) => getCategory(item)?.name ?? "";
const getRarityName = (item) => item?.rarity?.name ?? "";

const requiresAttunement = (item) =>
  Array.isArray(item?.desc) &&
  item.desc.some((d) => norm(d).includes("requires attunement"));

const isCursed = (item) =>
  Array.isArray(item?.desc) &&
  item.desc.some((d) => norm(d).includes("curse"));

export default function MagicItem() {
  const { index } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        // Keep API usage low:
        // 1) fetch item
        // 2) fetch variants only if present
        const itemRes = await getMagicItemByIndex(index);
        const data = itemRes?.data ?? null;
        setItem(data);

        if (data?.variants?.length) {
          const varRes = await getMagicItemVariants(index);
          setVariants(Array.isArray(varRes?.data) ? varRes.data : []);
        } else {
          setVariants([]);
        }
      } catch {
        setItem(null);
        setVariants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [index]);

  if (loading) return <div className="loading">Magic item details loading...</div>;
  if (!item) return <div className="error">Magic item not found.</div>;

  const firstDesc = Array.isArray(item.desc) && item.desc.length ? item.desc[0] : "";

  return (
    <div id="magicitem-comp" className="monster-page-container">
      <div className="monster-overlay">
        <button className="back-button" onClick={() => navigate("/wiki/magic-items")}>
          ← Back to Magic Items
        </button>

        <div className="monster-detail-card">
          <div className="monster-header">
            <h2>{item.name}</h2>

            <p className="monster-summary">
              <b>{item.name}</b> is a{" "}
              <b>{getRarityName(item) || "unknown rarity"}</b> magic item in the{" "}
              <b>{getCategoryName(item) || "unknown category"}</b> category.
            </p>
          </div>

          <div className="monster-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Category</span>
                <p>{getCategoryName(item) || "Unknown"}</p>
              </div>

              <div className="info-item">
                <span className="info-label">Rarity</span>
                <p>{getRarityName(item) || "Unknown"}</p>
              </div>

              <div className="info-item">
                <span className="info-label">Requires Attunement</span>
                <p>{requiresAttunement(item) ? "Yes" : "No"}</p>
              </div>

              <div className="info-item">
                <span className="info-label">Cursed</span>
                <p>{isCursed(item) ? "Yes" : "No"}</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Description</span>
              <p>{firstDesc || "No description available."}</p>
            </div>

            {variants.length > 0 && (
              <div className="info-item">
                <span className="info-label">Variants</span>
                <ul>
                  {variants.map((v) => (
                    <li key={v.index}>
                      <button
                        className="back-button"
                        onClick={() => navigate(`/magic-item/${v.index}`)}
                      >
                        {v.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


