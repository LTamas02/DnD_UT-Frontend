import React from 'react'
import { Link } from 'react-router-dom'

export default function Card({character}) {   
return (
    <div className="card col-md-3" style={{ width: "18rem", marginLeft: "4.5%"}}>
        <Link to={`../pages/character/${character.id}`}>
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
        </Link>
    </div>
)
}
