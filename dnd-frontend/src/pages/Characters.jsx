// fileName: Characters.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- ÚJ IMPORT
import Card from '../components/Card';
import { getPdfList } from '../Api';
import '../assets/styles/Characters.css';
import '../assets/styles/Navbar.css';
import '../assets/styles/Card.css';

export default function Characters() {
    const [characters, setCharacters] = useState([]);
    const token = localStorage.getItem("token"); // Auth token
    const navigate = useNavigate(); // <--- ÚJ HOOK

    useEffect(() => {
        const fetchCharacters = async () => {
            // ... (meglévő fetch logika)
        };

        fetchCharacters();
    }, [token]);
    
    // ÚJ FUNKCIÓ: Navigálás az új karakter készítő oldalra
    const handleCreateNew = () => {
        navigate('/character/new');
    };

    return (
        <div id="characters-comp">
            <h1>Characters</h1>
            <div className="row">
                {characters.map(character => (
                    <Card key={character.id} character={character} />
                ))}

                {/* Static test cards */}
                <Card character={{ name: "Teszt Alany1", class: "Wizard", level: 1, race: "Human", world: "Earth" }} />
                <Card character={{ name: "Teszt Alany2", class: "Fighetr", level: 1, race: "Human", world: "Earth" }} />
                <Card character={{ name: "Teszt Alany3", class: "Bard", level: 1, race: "Human", world: "Earth" }} />
                <Card character={{ name: "Teszt Alany4", class: "Ranger", level: 1, race: "Human", world: "Earth" }} />
                <Card character={{ name: "Teszt Alany", class: "Wizard", level: 1, race: "Human", world: "Earth" }} />

                {/* Add New Character card - MÓDOSÍTVA */}
                <div
                    className="card add-card col-md-3"
                    style={{
                        width: "18rem",
                        marginLeft: "4.5%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}
                    onClick={handleCreateNew} // <--- KÁRTYA KLIKK
                >
                    Create New Character
                    <button
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            width: "50%",
                            fontSize: '4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Add Character"
                        onClick={(e) => { e.stopPropagation(); handleCreateNew(); }} // <--- GOMB KLIKK (megakadályozza a buborékolást)
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}