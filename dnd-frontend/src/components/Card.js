import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getPdf } from '../Api';

export default function Card({ character }) {
    const navigate = useNavigate();
    const token = localStorage.getItem("token"); // Auth token

    const handleClick = async () => {
        if (character.id && character.name && character.class === "PDF Character") {
            // This is a PDF character → Download PDF
            try {
                const res = await getPdf(character.id, token, { responseType: "blob" });
                const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", character.name);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (error) {
                console.error("Failed to download PDF:", error);
            }
        } else {
            // Normal card → Navigate to character details
            navigate(`../pages/character/${character.id}`);
        }
    };

    return (
        <div
            className="card col-md-3"
            style={{
                width: "18rem",
                marginLeft: "4.5%",
                cursor: "pointer",
                userSelect: "none"
            }}
            onClick={handleClick}
            title={character.class === "PDF Character" ? "Download PDF" : "View Character"}
        >
            <div className="card-body">
                <h5 className="card-title">{character.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                    {character.class} (Level {character.level})
                </h6>
                <p className="card-text">
                    {character.race}
                    {character.world ? ` | World: ${character.world}` : ''}
                </p>
            </div>
        </div>
    );
}
