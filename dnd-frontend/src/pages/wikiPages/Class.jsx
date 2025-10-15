import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClassByIndex } from "../../Api";
import "../../assets/styles/Class.css";

const Class = () => {
  const { index } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getClassByIndex(index);
      setClassData(data);
      setLoading(false);
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
    <div id="class-page">
      <button className="back-button" onClick={() => navigate("/wiki/classes")}>
        ← Back to Classes
      </button>

      <main>
        <div className="class-detail-card">
          <div className="class-header">
            <h2>{classData.name}</h2>
            <p>The {classData.name} is a powerful class with a hit die of d{classData.hit_die}.</p>
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
                <p>{(classData.saving_throws || []).map(st => st.name).join(", ") || "-"}</p>
              </div>
              <div className="info-item">
                <span className="info-label">Proficiencies</span>
                <p>{getProficiencyChoices(classData)}</p>
              </div>
            </div>

            <div className="info-item">
              <span className="info-label">Weapon Proficiencies</span>
              <ul>
                {(classData.proficiencies || []).filter(p => p.name.includes("Weapon")).map((p,i) => <li key={i}>{p.name}</li>)}
              </ul>
            </div>

            <div className="info-item">
              <span className="info-label">Armor Proficiencies</span>
              <ul>
                {(classData.proficiencies || []).filter(p => p.name.includes("Armor") || p.name.includes("Shield")).map((p,i) => <li key={i}>{p.name}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Class;
