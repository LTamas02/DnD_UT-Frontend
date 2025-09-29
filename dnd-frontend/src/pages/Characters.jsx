import { use, useEffect, useState } from 'react'
import Card from '../components/Card';
import axios from 'axios';

import '../assets/styles/Characters.css';
import '../assets/styles/Navbar.css';
import '../assets/styles/Card.css';

import { Navbar } from '../components/Navbar';

export default function Characters() {
    // useState and useEffect can be used here to fetch characters from an API
    // axios.get('http://localhost:8080/api/characters')
    const [characters, setCharacters] = useState([])

    useEffect(() => {
        axios.get('http://localhost:8080/api/characters')
            .then(res => {
                setCharacters(res.data);
            })
            .catch(error => {
                console.error("There was an error fetching the characters!", error);
            });
    }, []);



return (
    <div id="characters-comp">
        <Navbar />
        <h1>Characters</h1>
        <div className="row">
            {characters.map((character) => (
                <Card key={character.id} character={character} />
            ))}
            <Card character={{name: "Teszt Alany1", class: "Wizard", level: 1, race: "Human", world: "Earth" }} />
            <Card character={{name: "Teszt Alany2", class: "Fighetr", level: 1, race: "Human", world: "Earth" }} />
            <Card character={{name: "Teszt Alany3", class: "Bard", level: 1, race: "Human", world: "Earth" }} />
            <Card character={{name: "Teszt Alany4", class: "Ranger", level: 1, race: "Human", world: "Earth" }} />
            <Card character={{name: "Teszt Alany", class: "Wizard", level: 1, race: "Human", world: "Earth" }} />
            <div className="card add-card col-md-3" style={{ width: "18rem", marginLeft: "4.5%", display: "flex", alignItems: "center", justifyContent: "center"}}>
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
)
}
