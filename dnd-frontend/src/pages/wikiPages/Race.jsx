import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRaceByIndex,
  getRaceTraits,
  getRaceSubraces,
  getRaceLanguages,
  getRaceAbilityBonuses,
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

  useEffect(() => {
    const fetchRaceDetails = async () => {
      setLoading(true);
      const data = await getRaceByIndex(index);
      const raceTraits = await getRaceTraits(index);
      const raceLanguages = await getRaceLanguages(index);
      const raceSubraces = await getRaceSubraces(index);
      const raceAbilities = await getRaceAbilityBonuses(index);

      setRaceData(data);
      setTraits(raceTraits);
      setLanguages(raceLanguages);
      setSubraces(raceSubraces);
      setAbilities(raceAbilities);
      setLoading(false);
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
              The {raceData.name} is a {raceData.size} race with a speed of{" "}
              {raceData.speed} feet.
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
                {traits.length
                  ? traits.map((t, i) => <li key={i}>{t.name}</li>)
                  : "No traits"}
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

            <div className="info-item">
              <span className="info-label">Subraces</span>
              <ul>
                {subraces.length
                  ? subraces.map((s, i) => <li key={i}>{s.name}</li>)
                  : "No subraces"}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
    </div>
  );
};

export default Race;
