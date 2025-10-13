import React, { useState, useEffect } from "react";
import {
    getCommunities,
    createCommunity as apiCreateCommunity
} from "../Api";
import { getUser } from "../Api";
import "../assets/styles/Community.css";

const CommunityPage = ({ token }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [communities, setCommunities] = useState([]);
    const [user, setUser] = useState(null);

    // Load logged-in user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getUser(token);
                setUser(res.data);
            } catch (err) {
                console.error("Error fetching user", err);
            }
        };
        fetchUser();
    }, [token]);

    // Load communities
    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const res = await getCommunities(token);
                setCommunities(res.data);
            } catch (err) {
                console.error("Error fetching communities", err);
            }
        };
        fetchCommunities();
    }, [token]);

    const createCommunity = async () => {
        if (!name || !description) {
            alert("Name and description cannot be empty!");
            return;
        }

        try {
            const body = {
                name,
                description,
                ownerId: user?.id || 0,
                isPrivate
            };

            const res = await apiCreateCommunity(body, token);

            alert("Guild created successfully!");
            setName("");
            setDescription("");
            setIsPrivate(false);

            // Refresh list after creation
            setCommunities((prev) => [...prev, res.data]);
        } catch (err) {
            console.error(err.response || err);
            alert("Error creating guild: " + (err.response?.data || err.message));
        }
    };

    return (
        <div className="community-page">
            <header className="guild-header">
                <h1>✨ Fantasy Guild Hall ✨</h1>
                <p>Your gateway to creating & exploring guilds</p>
            </header>

            <section className="community-form">
                <h2>Create a Guild</h2>
                <label>
                    Guild Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>

                <label>
                    Description:
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    Private Guild
                </label>

                <div className="form-buttons">
                    <button className="btn-gold" onClick={createCommunity}>
                        Create Guild
                    </button>
                </div>
            </section>

            <section className="community-list">
                <h2>Existing Guilds</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Owner</th>
                            <th>Private?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {communities.map((com) => (
                            <tr key={com.id}>
                                <td>{com.name}</td>
                                <td>{com.description}</td>
                                <td>{com.ownerId}</td>
                                <td>{com.isPrivate ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default CommunityPage;
