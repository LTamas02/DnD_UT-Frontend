import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllClasses } from "../../assets/api/wikiapi";
import "../../assets/styles/WikiTheme.css";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getAllClasses();
        setClasses(data);
      } catch {
        setError("An error occurred while loading classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) return <div className="page-content"><div className="loading">Loading...</div></div>;
  if (error) return <div className="page-content"><div className="error">{error}</div></div>;

  return (
    <div id="classes-comp">
      <div className="page-content">
        <header>
          <button className="back-button" onClick={() => navigate("/wiki")}>
            ← Back to Main Page
          </button>
          <h1>D&D Class Wiki</h1>
          <p className="subtitle">Discover the secrets of Dungeons & Dragons classes</p>
        </header>

        <div className="classes-grid">
          {classes.length === 0 ? (
            <div className="error">No classes available.</div>
          ) : (
            classes.map((cls) => (
              <Link
                to={`/class/${cls.index}`}
                key={cls.index}
                className={`class-card`}
                style={{
                  backgroundImage: `url(${require(`../../assets/img/BG/classes/${cls.index}.jpg`)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  color: 'var(--app-accent, #FFD700)'
                }}
              >
                <h3 className="class-name">{cls.name}</h3>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


