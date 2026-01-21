import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRaceByIndex,
  getRaceTraits,
  getRaceLanguages,
  getRaceAbilityBonuses,
  getSubracesByRaceName,
} from "../../Api";
import "../../assets/styles/WikiTheme.css";

const Race = () => {
  const { index } = useParams();
  const navigate = useNavigate();

  const [raceData, setRaceData] = useState(null);
  const [traits, setTraits] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [subraces, setSubraces] = useState([]);
  const [abilities, setAbilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchRaceDetails = async () => {
      setLoading(true);

      try {
        const data = await getRaceByIndex(index);
        setRaceData(data);

        const [raceTraits, raceLanguages, raceAbilities] = await Promise.all([
          getRaceTraits(index),
          getRaceLanguages(index),
          getRaceAbilityBonuses(index),
        ]);

        setTraits(Array.isArray(raceTraits) ? raceTraits : []);
        setLanguages(Array.isArray(raceLanguages) ? raceLanguages : []);
        setAbilities(Array.isArray(raceAbilities) ? raceAbilities : []);

        // ✅ Load subraces from YOUR backend, by race name
        if (data?.name) {
          setSubLoading(true);
          try {
            const res = await getSubracesByRaceName(data.name);
            setSubraces(Array.isArray(res?.data) ? res.data : []);
          } catch {
            setSubraces([]);
          } finally {
            setSubLoading(false);
          }
        } else {
          setSubraces([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRaceDetails();
  }, [index]);

  if (loading) return <div className="loading">Race details loading...</div>;
  if (!raceData) return <div className="error">Race not found.</div>;

  return (
    <div id="race-comp">
      <div id="race-page">
        <button className="back-button" onClick={() => navigate("/wiki/races")}>
          ← Back to Races
        </button>

        <main>
          <div className="race-detail-card">
            <div className="race-header">
              <h2>{raceData.name}</h2>
              <p>
                The {raceData.name} is a {raceData.size} race with a speed of {raceData.speed} feet.
              </p>
            </div>

            <div className="race-info">
              <h3>General Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Size</span>
                  <p>{raceData.size}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">Speed</span>
                  <p>{raceData.speed} feet</p>
                </div>
              </div>

              <div className="info-item">
                <span className="info-label">Ability Bonuses</span>
                <div className="abilities">
                  {abilities.length
                    ? abilities.map((ab, i) => (
                        <span key={i} className="ability-bonus">
                          {ab.ability_score?.name} +{ab.bonus}
                        </span>
                      ))
                    : "No bonuses"}
                </div>
              </div>

              <div className="info-item">
                <span className="info-label">Traits</span>
                <ul>
                  {traits.length ? traits.map((t, i) => <li key={i}>{t.name}</li>) : "No traits"}
                </ul>
              </div>

              <div className="info-item">
                <span className="info-label">Languages</span>
                <ul>
                  {languages.length
                    ? languages.map((l, i) => <li key={i}>{l.name}</li>)
                    : "No languages"}
                </ul>
              </div>

              {/* ✅ Subraces from your controller */}
              <div className="info-item">
                <span className="info-label">Subraces</span>

                {subLoading ? (
                  <div className="loading">Loading subraces...</div>
                ) : subraces.length === 0 ? (
                  <p>No subraces.</p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    {subraces.map((sr) => (
                      <div
                        key={sr.index}
                        className="monster-card"
                        onClick={() => navigate(`/race/${raceData.index}/subrace/${sr.index}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="monster-header">
                          <h3 className="monster-name">{sr.name}</h3>
                          <div className="monster-size-type">{sr?.race?.name || raceData.name}</div>
                          <div className="monster-alignment">{sr.index}</div>
                        </div>
                        <div className="monster-details">
                          <div className="detail-item">
                            <span className="detail-label">Bonuses:</span>
                            <span className="detail-value">
                              {Array.isArray(sr?.abilityBonuses) ? sr.abilityBonuses.length : 0}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Traits:</span>
                            <span className="detail-value">
                              {Array.isArray(sr?.racialTraits) ? sr.racialTraits.length : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* end subraces */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Race;
