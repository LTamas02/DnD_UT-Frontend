// fileName: Characters.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { CharacterApi } from '../assets/api/dndtoolapi';
import '../assets/styles/Characters.css';
import '../assets/styles/Navbar.css';
import '../assets/styles/Card.css';

export default function Characters() {
    const [characters, setCharacters] = useState([]);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const data = await CharacterApi.getAll();
                setCharacters(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load characters:", error);
                setCharacters([]);
            }
        };

        fetchCharacters();
    }, [token]);

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
                    onClick={handleCreateNew}
                >
                    Create New Character
                    <button
                        style={{
                            backgroundColor: 'var(--app-accent, #007bff)',
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
                        onClick={(e) => { e.stopPropagation(); handleCreateNew(); }}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}

