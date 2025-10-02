import { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getPdfList } from '../Api';
import '../assets/styles/Characters.css';
import '../assets/styles/Navbar.css';
import '../assets/styles/Card.css';

export default function Characters() {
    const [characters, setCharacters] = useState([]);
    const token = localStorage.getItem("token"); // Auth token

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const res = await getPdfList(token);
                // Map PDFs into character-like objects for Card
                const mappedCharacters = res.data.map(pdf => ({
                    id: pdf.id,
                    name: pdf.fileName,
                    class: "PDF Character", // placeholder for PDF characters
                    level: "-",
                    race: "-",
                    world: "-",
                    uploadedAt: pdf.uploadedAt
                }));
                setCharacters(mappedCharacters);
            } catch (error) {
                console.error("There was an error fetching the characters!", error.response?.data || error.message);
            }
        };

        fetchCharacters();
    }, [token]);

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

                {/* Add New Character card */}
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
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}
