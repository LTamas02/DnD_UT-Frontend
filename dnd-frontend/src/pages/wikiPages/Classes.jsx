import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllClasses } from "../../Api";
import "../../assets/styles/Classes.css";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getAllClasses();
        setClasses(data);
      } catch {
        setError("Hiba történt a kasztok betöltése során.");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) return <div className="page-content"><div className="loading">Betöltés...</div></div>;
  if (error) return <div className="page-content"><div className="error">{error}</div></div>;

  return (
    <div id="classes-comp" className="page-content">
      <header>
        <h1>D&D Class Wiki</h1>
        <p className="subtitle">Fedezd fel a Dungeons & Dragons kasztjainak titkait</p>
      </header>

      <div className="classes-grid">
        {classes.length === 0 ? (
          <div className="error">Nincsenek elérhető kasztok.</div>
        ) : (
          classes.map((cls) => (
            <Link to={`/class/${cls.index}`} key={cls.index} className={`class-card ${cls.index}`}>
              <span className="class-icon">{getClassIcon(cls.index)}</span>
              <h3 className="class-name">{cls.name}</h3>
              <p className="class-description">Kattints a részletekért...</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function getClassIcon(slug) {
  const icons = {
    barbarian: '⚔️',
    bard: '🎵',
    cleric: '🙏',
    druid: '🌿',
    fighter: '🛡️',
    monk: '🥋',
    paladin: '✝️',
    ranger: '🏹',
    rogue: '🗡️',
    sorcerer: '🔮',
    warlock: '👁️',
    wizard: '📚'
  };
  return icons[slug] || '✨';
}
