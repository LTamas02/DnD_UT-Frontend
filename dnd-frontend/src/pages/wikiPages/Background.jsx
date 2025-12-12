import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getBackgroundByIndex,
    getBackgroundFeature,
    getBackgroundStartingEquipment,
    getBackgroundProficiencies
} from '../../Api';
import '../../assets/styles/WikiTheme.css';

// Segédfüggvény a felszerelés listájának formázásához (változatlan)
const formatItems = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return <li>Not specified.</li>;
    return items.map((item, index) => {
        const name = item.item?.name || item.equipment?.name || item.name || 'Unknown Item';
        const quantity = item.quantity || 1;
        const description = item.desc ? ` (${item.desc})` : '';
        return (
            <li key={index}>
                {quantity > 1 ? `${quantity}x ` : ''}
                {name}
                {description}
            </li>
        );
    });
};

// Segédfüggvény a választható felszerelések formázásához (változatlan)
const formatChoices = (options) => {
    if (!options || !Array.isArray(options) || options.length === 0) return <p>No optional equipment choices.</p>;
    
    return options.map((option, index) => (
        <div key={index} className="wiki-choice-group">
            <p><strong>Choose {option.choose} item(s) from the following:</strong></p>
            <ul className="wiki-list wiki-choice-list">
                {option.from?.options && Array.isArray(option.from.options) ? (
                    option.from.options.map((opt, i) => {
                        const name = opt.item?.name || opt.equipment?.name || opt.name || 'Unknown Choice';
                        const quantity = opt.quantity || 1;
                        return (
                            <li key={i}>
                                {name}
                                {quantity > 1 ? ` (${quantity}x)` : ''}
                            </li>
                        );
                    })
                ) : (
                    <li>No choices listed.</li>
                )}
            </ul>
        </div>
    ));
}

export default function Background() {
    const { index: rawIndex } = useParams();
    // FIX: Kisbetűs index a sikeres kereséshez
    const index = rawIndex ? rawIndex.toLowerCase() : ''; 

    const [background, setBackground] = useState(null);
    const [feature, setFeature] = useState(null);
    const [equipment, setEquipment] = useState(null);
    const [proficiencies, setProficiencies] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        if (!index) {
             setError("No background index provided.");
             setLoading(false);
             return;
        }

        try {
            // Fő háttér adat lekérése
            const backgroundData = await getBackgroundByIndex(index);
            
            if (!backgroundData) {
                setError(`Background with index '${rawIndex}' not found. Index used: '${index}'.`);
                setLoading(false);
                return;
            }
            setBackground(backgroundData);
            
            // Kapcsolódó részletek párhuzamos lekérése (null-t ad vissza hibánál)
            const [featureData, equipmentData, proficienciesData] = await Promise.all([
                getBackgroundFeature(index),
                getBackgroundStartingEquipment(index),
                getBackgroundProficiencies(index)
            ]);

            setFeature(featureData);
            setEquipment(equipmentData);
            setProficiencies(proficienciesData);
            
            setLoading(false);

        } catch (err) {
            console.error(`Failed to fetch background ${index} or its details:`, err);
            setError("An unexpected error occurred while loading the background details.");
            setLoading(false);
        }
    }, [index, rawIndex]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="page-comp"><div className="page-overlay loading">Loading...</div></div>;
    }

    if (error) {
        return <div className="page-comp"><div className="page-overlay error">Error: {error}</div></div>;
    }
    
    if (!background) {
        return <div className="page-comp"><div className="page-overlay error">No data to display.</div></div>;
    }

    const hasEquipment = equipment && (equipment.Equipment?.length > 0 || equipment.EquipmentOptions?.length > 0);
    const hasProficiencies = proficiencies && proficiencies.length > 0;

    return (
        <div id="background-comp" className="page-comp">
            <div className="page-overlay">
                {/* Wax Seal stílusú vissza gomb */}
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back to Backgrounds List
                </button>

                {/* Részletes kártya stílus */}
                <div className="race-detail-card"> 
                    <header className="race-header" style={{backgroundColor: '#8b5a2b', justifyContent: 'center'}}>
                        <h2 className="wiki-title">{background.name}</h2>
                    </header>
                    
                    <div className="race-info">
                        
                        {/* Jellemző (Feature) */}
                        {feature && (
                            <section className="wiki-section">
                                <h3 className="info-label">Feature: {feature.name}</h3>
                                {/* info-item a belső, sötétebb háttérhez */}
                                <div className="info-item" style={{backgroundColor: 'rgba(69, 37, 16, 0.5)'}}>
                                    {feature.desc && Array.isArray(feature.desc) && feature.desc.map((desc, i) => (
                                        <p key={i}>{desc}</p>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {/* Jártasságok (Proficiencies) */}
                        {hasProficiencies && (
                            <section className="wiki-section">
                                <h3 className="info-label">Starting Proficiencies</h3>
                                <div className="info-item">
                                    <ul className="wiki-list" style={{listStyleType: 'none', padding: 0}}>
                                        {proficiencies.map((p, i) => (
                                            <li key={i}>{p.name || p}</li> 
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        )}

                        {/* Kezdőfelszerelés (Starting Equipment) */}
                        {hasEquipment && (
                            <section className="wiki-section">
                                <h3 className="info-label">Starting Equipment</h3>
                                
                                {equipment.Equipment?.length > 0 && (
                                    <div className="info-item" style={{marginBottom: '10px'}}>
                                        <h4>Base Equipment:</h4>
                                        <ul className="wiki-list" style={{paddingLeft: '20px'}}>
                                            {formatItems(equipment.Equipment)}
                                        </ul>
                                    </div>
                                )}

                                {equipment.EquipmentOptions?.length > 0 && (
                                    <div className="info-item">
                                        <h4>Optional Equipment:</h4>
                                        <div className="wiki-options-container">
                                            {formatChoices(equipment.EquipmentOptions)}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}