import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getClassByIndex } from "../../Api";
import "../../assets/styles/Classes.css";

export default function Class() {
  const { index } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const data = await getClassByIndex(index);
        setCls(data);
      } catch {
        setError("Hiba történt a kaszt betöltése során.");
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [index]);

  if (loading) return <div className="page-content"><div className="loading">Loading...</div></div>;
  if (error) return <div className="page-content"><div className="error">{error}</div></div>;

  return (
    <div id="class-details" className="page-content">
        <div className="class-detail">
      <header>
        <h1>{cls.name}</h1>
        <p className="subtitle">{cls.description}</p>
      </header>

      <div className="class-detail active">
        <div className="class-header">
          <h2 className="class-title">{cls.name}</h2>
        </div>

        <div className="class-content">
          <div className="class-info">
            <h3>Általános Információ</h3>
            <p><strong>Életkocka:</strong> {cls.hitDie}</p>
            <p><strong>Elsődleges Tulajdonság:</strong> {cls.primaryAbility}</p>
            <p><strong>Mentődobások:</strong> {cls.savingThrows?.join(", ")}</p>
            <p><strong>Fegyver Ismeret:</strong> {cls.weaponProficiencies}</p>
            <p><strong>Páncél Ismeret:</strong> {cls.armorProficiencies}</p>
          </div>

          <div className="class-abilities">
            <h3>Képességek</h3>
            {cls.features?.length > 0 ? (
              <ul className="ability-list">
                {cls.features.map(f => (
                  <li key={f.name}>
                    <strong>{f.name}</strong> {f.level ? `(${f.level}. szint)` : ""} <br />
                    {f.description ? <small>{f.description.substring(0, 100)}...</small> : null}
                  </li>
                ))}
              </ul>
            ) : <p>Nincsenek elérhető képességek.</p>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
