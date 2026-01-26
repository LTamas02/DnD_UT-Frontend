import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VttApi } from "../../assets/api/dndtoolapi";
import "../../assets/styles/Vtt.css";
import "../../assets/styles/DmtoolsMaps.css";

export default function VttLobby() {
    const [sessions, setSessions] = useState([]);
    const [newName, setNewName] = useState("");
    const [joinId, setJoinId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await VttApi.listSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load VTT sessions:", err);
            setError("Failed to load sessions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setError("");

        try {
            const res = await VttApi.createSession(name);
            const sessionId = res?.session?.id;
            if (sessionId) {
                navigate(`/vtt/${sessionId}`);
                return;
            }
            await loadSessions();
            setNewName("");
        } catch (err) {
            console.error("Failed to create VTT session:", err);
            setError("Failed to create session.");
        }
    };

    const handleJoin = async () => {
        const id = Number(joinId);
        if (!Number.isFinite(id) || id <= 0) {
            setError("Enter a valid session ID.");
            return;
        }
        setError("");

        try {
            await VttApi.joinSession(id);
            navigate(`/vtt/${id}`);
        } catch (err) {
            console.error("Failed to join VTT session:", err);
            setError("Failed to join session.");
        }
    };

    return (
        <div className="page-comp vtt-page">
            <div className="vtt-shell">
                <header className="vtt-header vtt-hero">
                    <div>
                        <span className="vtt-hero-kicker">The Portal Awaits</span>
                        <h1>Virtual Tabletop</h1>
                        <p>Host sessions, drop tokens, and roll dice together.</p>
                    </div>
                    <button className="dmtools-action vtt-glow-button" onClick={loadSessions}>
                        Refresh
                    </button>
                </header>

                {error && <div className="vtt-error">{error}</div>}

                <section className="vtt-lobby-grid">
                    <div className="vtt-panel">
                        <h2>Create a session</h2>
                        <label className="dmtools-label">Session name</label>
                        <input
                            className="dmtools-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Night of the Wyvern"
                        />
                        <button
                            className="dmtools-action vtt-glow-button"
                            onClick={handleCreate}
                        >
                            Create
                        </button>
                    </div>

                    <div className="vtt-panel">
                        <h2>Join by ID</h2>
                        <label className="dmtools-label">Session ID</label>
                        <input
                            className="dmtools-input"
                            value={joinId}
                            onChange={(e) => setJoinId(e.target.value)}
                            placeholder="123"
                        />
                        <button
                            className="dmtools-action vtt-glow-button"
                            onClick={handleJoin}
                        >
                            Join
                        </button>
                    </div>
                </section>

                <section className="vtt-panel">
                    <h2>My sessions</h2>
                    {loading ? (
                        <p>Loading sessions...</p>
                    ) : sessions.length === 0 ? (
                        <p>No sessions yet.</p>
                    ) : (
                        <div className="vtt-session-list">
                            {sessions.map((session) => (
                                <div key={session.id} className="vtt-session-card">
                                    <div className="vtt-session-info">
                                        <h3>{session.name}</h3>
                                        <p>Role: {session.role}</p>
                                        <p>Owner: {session.ownerName || "DM"}</p>
                                    </div>
                                    <button
                                        className="dmtools-action"
                                        onClick={() => navigate(`/vtt/${session.id}`)}
                                    >
                                        Open
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}


