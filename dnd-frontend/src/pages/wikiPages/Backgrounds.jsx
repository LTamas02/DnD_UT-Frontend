import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllBackgrounds } from '../../Api';
import '../../assets/styles/WikiTheme.css';

export default function Backgrounds() {
    const [backgrounds, setBackgrounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBackgrounds = async () => {
            try {
                // Az API függvény (getAllBackgrounds) kezeli a hibát és üres tömböt ad vissza.
                const data = await getAllBackgrounds();
                
                if (Array.isArray(data)) {
                    setBackgrounds(data);
                } else {
                    console.warn("API response was not a direct array:", data);
                    setBackgrounds([]);
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch backgrounds:", err);
                setError("Failed to load backgrounds. Check the API server status.");
                setLoading(false);
            }
        };

        fetchBackgrounds();
    }, []);

    if (loading) {
        return <div className="page-comp"><div className="page-overlay loading">Loading...</div></div>;
    }

    if (error) {
        return <div className="page-comp"><div className="page-overlay error">Error: {error}</div></div>;
    }
    
    return (
        // Fő stílus konténer
        <div id="backgrounds-comp" className="page-comp">
            {/* Overlay a pergamen hatásért */}
            <div id="backgrounds-page" className="page-overlay">
                <h1 className="page-overlay h1">Backgrounds</h1>
                <p className="page-overlay p">Browse through the available Dungeons & Dragons 5th Edition character backgrounds.</p>

                {backgrounds.length === 0 ? (
                    <div className="loading">No backgrounds found. Check the API server status and response structure.</div>
                ) : (
                    // Grid elrendezés
                    <div className="wiki-grid">
                        {backgrounds.map((background) => (
                            // Kártya stílus
                            <Link 
                                to={`/background/${background.index}`} 
                                key={background.index} 
                                className="wiki-card"
                            >
                                <h3 className="wiki-card h3">{background.name}</h3>
                                <p className="wiki-card p">D&D 5th Edition Character Background.</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}