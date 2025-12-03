import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CharacterApi } from "../Api";

const Character = () => {
  const { id } = useParams();
  const [char, setChar] = useState(null);
  const [sheet, setSheet] = useState({});

  useEffect(() => {
    CharacterApi.get(id).then((data) => {
      setChar(data);

      try {
        setSheet(JSON.parse(data.sheetDataJson));
      } catch {
        setSheet({});
      }
    });
  }, [id]);

  if (!char) return <div>Loading...</div>;

  return (
    <div className="page-comp">
      <div className="page-overlay">
        <h1>{char.name}</h1>
        <p>{char.race} – Level {char.level} {char.class}</p>

        <h2>Character Sheet Data</h2>
        <pre>{JSON.stringify(sheet, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Character;
