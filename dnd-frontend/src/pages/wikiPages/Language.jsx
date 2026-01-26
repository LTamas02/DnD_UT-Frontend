import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLanguageByIndex } from '../../assets/api/wikiapi';
import '../../assets/styles/WikiTheme.css';

export default function Language() {
    const { index: rawIndex } = useParams();
    const index = rawIndex ? rawIndex.toLowerCase() : '';
    const navigate = useNavigate();

    const [language, setLanguage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLanguage = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getLanguageByIndex(index);
                if (!data) {
                    setError(`Language '${rawIndex}' not found.`);
                } else {
                    setLanguage(data);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load language details.");
            } finally {
                setLoading(false);
            }
        };

        fetchLanguage();
    }, [index, rawIndex]);

    if (loading) return <div className="page-comp"><div className="page-overlay loading">Loading...</div></div>;
    if (error) return <div className="page-comp"><div className="page-overlay error">{error}</div></div>;
    if (!language) return null;

    return (
        <div id="language-comp" className="page-comp">
            <div className="page-overlay">
                {/* Wax Seal Back Button */}
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back to Languages List
                </button>

                <div className="race-detail-card">
                    <header className="race-header" style={{backgroundColor: 'var(--app-button-bg, #8b5a2b)', justifyContent: 'center'}}>
                        <h2 className="wiki-title">{language.name}</h2>
                    </header>

                    <div className="race-info">
                        {language.type && <p><strong>Type:</strong> {language.type}</p>}
                        {language.script && <p><strong>Script:</strong> {language.script}</p>}

                        {language.desc && (
                            <section className="wiki-section">
                                <h3 className="info-label">Description</h3>
                                <div className="info-item" style={{backgroundColor: 'var(--app-panel, rgba(69, 37, 16, 0.5))'}}>
                                    {Array.isArray(language.desc)
                                        ? language.desc.map((d, i) => <p key={i}>{d}</p>)
                                        : <p>{language.desc}</p>}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


