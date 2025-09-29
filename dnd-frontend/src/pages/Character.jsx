import axios from 'axios';
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function Character() {

    const [character, setCharacter] = useState(null);
    const {id} = useParams();

    useEffect(() => {
      
        axios.get(`http://localhost:8080/api/characters/${id}`)
            .then(response => {
                setCharacter(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the character!", error);
            });

    }, [])
    




  return (
    <div>{character.name}</div>
  )
}
