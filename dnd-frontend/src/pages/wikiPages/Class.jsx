import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClassByIndex, getSubclassesByClassName } from "../../assets/api/wikiapi";
import "../../assets/styles/WikiTheme.css";

const Class = () => {
  const { index } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [subclasses, setSubclasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSubclasses([]);

      try {
        const data = await getClassByIndex(index);
        setClassData(data);

        // subclasses are fetched by CLASS NAME (your backend expects className)
        if (data?.name) {
          setSubLoading(true);
          try {
            const res = await getSubclassesByClassName(data.name);
            setSubclasses(Array.isArray(res?.data) ? res.data : []);
          } catch {
            setSubclasses([]);
          } finally {
            setSubLoading(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [index]);

  if (loading) return <div className="loading">Loading class details...</div>;
  if (!classData) return <div className="error">Class not found.</div>;

  const getPrimaryAbility = (data) =>
    data.saving_throws?.length
      ? data.saving_throws.map((st) => st.name).join(", ")
      : "Strength and Constitution";

  const getProficiencyChoices = (data) =>
    data.proficiency_choices?.length
      ? data.proficiency_choices[0].desc
      : "No choices available";

  return (
    <div
      id="class-comp"
      style={{
        backgroundImage: `url(${require(`../../assets/img/BG/classes/${classData.index}.jpg`)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <button className="back-button" onClick={() => navigate("/wiki/classes")}>
        ← Back to Classes
      </button>

      <div className="class-detail-card">
        <div className="class-header">
          <h2>{classData.name}</h2>
          <p>
            The {classData.name} is a powerful class with a hit die of d{classData.hit_die}.
          </p>
        </div>

        <div className="class-info">
          <h3>General Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Hit Die</span>
              <p>d{classData.hit_die}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Primary Ability</span>
              <p>{getPrimaryAbility(classData)}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Saving Throws</span>
              <p>{(classData.saving_throws || []).map((st) => st.name).join(", ") || "-"}</p>
            </div>
            <div className="info-item">
              <span className="info-label">Proficiencies</span>
              <p>{getProficiencyChoices(classData)}</p>
            </div>
          </div>

          <div className="info-item">
            <span className="info-label">Weapon Proficiencies</span>
            <ul>
              {(classData.proficiencies || [])
                .filter((p) => p.name.includes("Weapon"))
                .map((p, i) => (
                  <li key={i}>{p.name}</li>
                ))}
            </ul>
          </div>

          <div className="info-item">
            <span className="info-label">Armor Proficiencies</span>
            <ul>
              {(classData.proficiencies || [])
                .filter((p) => p.name.includes("Armor") || p.name.includes("Shield"))
                .map((p, i) => (
                  <li key={i}>{p.name}</li>
                ))}
            </ul>
          </div>

          {/* ✅ Subclasses section */}
          <div className="info-item" style={{ marginTop: 18 }}>
            <span className="info-label">Subclasses</span>

            {subLoading ? (
              <div className="loading">Loading subclasses...</div>
            ) : subclasses.length === 0 ? (
              <p>None found for this class.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {subclasses.map((sc) => (
                  <div
                    key={sc.index}
                    className="monster-card"
                    onClick={() => navigate(`/subclass/${sc.index}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="monster-header">
                      <h3 className="monster-name">{sc.name}</h3>
                      <div className="monster-size-type">{sc.subclassFlavor || "Subclass"}</div>
                      <div className="monster-alignment">{sc.index}</div>
                    </div>
                    <div className="monster-details">
                      <div className="detail-item">
                        <span className="detail-label">Class:</span>
                        <span className="detail-value">{sc?.class?.name || classData.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Spells:</span>
                        <span className="detail-value">{Array.isArray(sc?.spells) ? sc.spells.length : 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* end subclasses */}
        </div>
      </div>
    </div>
  );
};

export default Class;


