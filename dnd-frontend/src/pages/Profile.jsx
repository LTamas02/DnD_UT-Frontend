import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../assets/styles/Profile.css";
import "bootstrap/dist/css/bootstrap.css";
import "../assets/styles/Login.css";
import "../assets/styles/Footer.css";
import Footer from "../components/Footer";
import {
    getUser,
    getFriends,
    deleteFriend,
    searchFriends,
    addFriend,
    getFriendRequests,
    respondFriendRequest,
    updateProfilePicture,
    updateProfilePictureFile,
    getProfileTheme,
    updateProfileTheme
} from "../Api";

const API_BASE = "https://api.dnd-tool.com";
const THEME_KEY = "profileTheme";

const DEFAULT_THEME = {
    bgImage: "",
    bgGradient: "linear-gradient(130deg, rgba(10,6,4,0.75), rgba(64,36,18,0.85))",
    pageBg: "#2f1e16",
    overlay: "rgba(0,0,0,0.35)",
    cardBg: "#4e342e",
    cardBorder: "#795548",
    accent: "#ffcc80",
    text: "#ffe7c2",
    muted: "#c9a980",
    panelBg: "rgba(255,255,255,0.12)",
    panelText: "#ffe7c2",
    buttonBg: "#795548",
    buttonText: "#fff8e1",
    friendBg: "#5d4037"
};

const THEME_PRESETS = [
    {
        id: "ember",
        name: "Ember Hearth",
        theme: {
            bgGradient: "linear-gradient(135deg, rgba(14,8,6,0.85), rgba(64,20,12,0.92))",
            pageBg: "#281813",
            accent: "#ffb36b",
            text: "#ffe3c4",
            muted: "#d0a578",
            panelBg: "rgba(255,190,120,0.08)",
            buttonBg: "#6b3b2a"
        }
    },
    {
        id: "forest",
        name: "Wyrdwood",
        theme: {
            bgGradient: "linear-gradient(140deg, rgba(6,12,10,0.9), rgba(18,60,48,0.85))",
            pageBg: "#0f1a15",
            accent: "#7ce0b4",
            text: "#d7fff0",
            muted: "#98c7b4",
            cardBg: "#1d2f29",
            friendBg: "#223a32",
            buttonBg: "#2f4d41"
        }
    },
    {
        id: "midnight",
        name: "Night Ledger",
        theme: {
            bgGradient: "linear-gradient(140deg, rgba(8,8,16,0.9), rgba(40,28,72,0.88))",
            pageBg: "#141123",
            accent: "#f0b9ff",
            text: "#f8e9ff",
            muted: "#cab4e6",
            cardBg: "#2a223d",
            buttonBg: "#3d2f5c"
        }
    },
    {
        id: "sunlit",
        name: "Sunlit Archive",
        theme: {
            bgGradient: "linear-gradient(135deg, rgba(255,242,224,0.85), rgba(218,170,110,0.82))",
            pageBg: "#f6e1c8",
            accent: "#7c2f1c",
            text: "#3b1f14",
            muted: "#7c5841",
            cardBg: "#fdf6eb",
            cardBorder: "#d6b087",
            panelBg: "rgba(60,30,15,0.08)",
            panelText: "#3b1f14",
            buttonBg: "#7c2f1c",
            buttonText: "#fff0d6",
            friendBg: "#f2dbc0"
        }
    }
];

const toAbsUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
    return url;
};

const Profile = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [profilePic, setProfilePic] = useState("/defaults/profile_picture.jpg");

    const [modalVisible, setModalVisible] = useState(false);
    const [friendSearchModal, setFriendSearchModal] = useState(false);
    const [friendRequestsModal, setFriendRequestsModal] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const themeReadyRef = React.useRef(false);
    const themeSaveTimerRef = React.useRef(null);

    useEffect(() => {
        if (!token) {
            navigate("/logreg");
            return;
        }

        getUser(token)
            .then(res => {
                setUser(res.data);
                setProfilePic(
                    res.data.profilePictureUrl ||
                    res.data.profilePicture ||
                    "/defaults/profile_picture.jpg"
                );
            })
            .catch(err => console.error("Error loading user:", err));

        getFriends(token)
            .then(res => setFriends(res.data || []))
            .catch(err => console.error("Error loading friends:", err));

        getFriendRequests(token)
            .then(res => setFriendRequests(res.data || []))
            .catch(err => console.error("Error loading friend requests:", err));
    }, [token, navigate]);

    useEffect(() => {
        const raw = localStorage.getItem(THEME_KEY);
        if (!raw) return;
        try {
            const saved = JSON.parse(raw);
            setTheme({ ...DEFAULT_THEME, ...saved });
        } catch {
            // ignore invalid saved theme
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    }, [theme]);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        let hasServerTheme = false;
        themeReadyRef.current = false;

        getProfileTheme(token)
            .then(res => {
                if (cancelled) return;
                if (res.data?.theme) {
                    hasServerTheme = true;
                    const merged = { ...DEFAULT_THEME, ...res.data.theme };
                    setTheme(merged);
                    localStorage.setItem(THEME_KEY, JSON.stringify(merged));
                }
            })
            .catch(err => console.error("Error loading profile theme:", err))
            .finally(() => {
                if (cancelled) return;
                themeReadyRef.current = true;
                if (!hasServerTheme) {
                    updateProfileTheme(token, theme).catch(err =>
                        console.error("Error saving profile theme:", err)
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        if (!token || !themeReadyRef.current) return;

        if (themeSaveTimerRef.current) {
            clearTimeout(themeSaveTimerRef.current);
        }

        themeSaveTimerRef.current = setTimeout(() => {
            updateProfileTheme(token, theme).catch(err =>
                console.error("Error saving profile theme:", err)
            );
        }, 700);

        return () => {
            if (themeSaveTimerRef.current) {
                clearTimeout(themeSaveTimerRef.current);
            }
        };
    }, [theme, token]);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/logreg");
    };

    const removeFriend = (friendId) => {
        if (!window.confirm("Are you sure you want to remove this friend?")) return;

        deleteFriend(token, friendId)
            .then(() => {
                setFriends(friends.filter(f => f.id !== friendId));
            })
            .catch(err => console.error("Error removing friend:", err));
    };

    const openModal = () => setModalVisible(true);
    const closeModal = () => setModalVisible(false);

    const openFriendSearch = () => setFriendSearchModal(true);
    const closeFriendSearch = () => setFriendSearchModal(false);

    const toggleFriendRequestsModal = () => setFriendRequestsModal(!friendRequestsModal);

    const selectImage = async (imageName) => {
        if (!window.confirm("Are you sure you want to select this picture?")) return;
        const nextPicture = `/defaults/${imageName}`;
        try {
            await updateProfilePicture(token, nextPicture);
            setProfilePic(nextPicture);
            closeModal();
        } catch (err) {
            console.error("Error updating profile picture:", err);
            alert("Failed to update profile picture.");
        }
    };

    const handleUploadProfilePicture = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const res = await updateProfilePictureFile(token, file);
            const nextPicture = res.data?.profilePicture || res.data?.profilePictureUrl || profilePic;
            setProfilePic(nextPicture);
            closeModal();
        } catch (err) {
            console.error("Error uploading profile picture:", err);
            alert("Failed to upload profile picture.");
        } finally {
            event.target.value = "";
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) return;

        setLoadingSearch(true);
        searchFriends(token, searchQuery)
            .then(res => {
                setSearchResults(res.data);
                setLoadingSearch(false);
            })
            .catch(err => {
                console.error("Search error:", err);
                setLoadingSearch(false);
            });
    };

    const sendFriendRequest = (username) => {
        addFriend(token, username)
            .then(() => {
                alert(`Friend request sent to ${username}`);
            })
            .catch(err => console.error("Add friend error:", err));
    };

    const handleFriendRequest = (requestId, action) => {
        respondFriendRequest(token, requestId, action)
            .then(() => {
                setFriendRequests(friendRequests.filter(req => req.id !== requestId));
                alert(`Friend request ${action === "accept" ? "accepted" : "denied"}`);
            })
            .catch(err => console.error("Error responding to friend request:", err));
    };

    const themeVars = {
        "--profile-bg-image": theme.bgImage ? `url("${theme.bgImage}")` : "none",
        "--profile-bg-gradient": theme.bgGradient,
        "--profile-bg-color": theme.pageBg,
        "--profile-overlay": theme.overlay,
        "--profile-card-bg": theme.cardBg,
        "--profile-card-border": theme.cardBorder,
        "--profile-accent": theme.accent,
        "--profile-text": theme.text,
        "--profile-muted": theme.muted,
        "--profile-panel-bg": theme.panelBg,
        "--profile-panel-text": theme.panelText,
        "--profile-button-bg": theme.buttonBg,
        "--profile-button-text": theme.buttonText,
        "--profile-friend-bg": theme.friendBg
    };

    return (
        <div id="profile-comp" style={themeVars}>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="profile-box text-center">
                            <img
                                src={toAbsUrl(profilePic)}
                                alt="Profile"
                                className="profile-pic mb-3"
                            />
                            <h2 className="username">{user?.username || "Loading..."}</h2>
                            <div className="d-flex justify-content-center gap-2 mt-2">
                                <button className="btn btn-outline-primary" onClick={openModal}>
                                    Change Picture
                                </button>
                                <button className="btn btn-outline-danger" onClick={logout}>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="profile-customizer mt-4">
                    <div className="profile-customizer-header">
                        <div>
                            <h3>Theme Forge</h3>
                            <p>Customize colors, background, and surfaces. Changes save automatically.</p>
                        </div>
                        <button
                            className="profile-reset"
                            onClick={() => setTheme(DEFAULT_THEME)}
                        >
                            Reset
                        </button>
                    </div>

                    <div className="profile-presets">
                        {THEME_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                className="profile-preset"
                                onClick={() => setTheme((prev) => ({ ...prev, ...preset.theme }))}
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>

                    <div className="profile-customizer-grid">
                        <label className="profile-field">
                            Accent
                            <input
                                type="color"
                                value={theme.accent}
                                onChange={(event) => setTheme((prev) => ({ ...prev, accent: event.target.value }))}
                            />
                        </label>
                        <label className="profile-field">
                            Text
                            <input
                                type="color"
                                value={theme.text}
                                onChange={(event) => setTheme((prev) => ({ ...prev, text: event.target.value }))}
                            />
                        </label>
                        <label className="profile-field">
                            Muted
                            <input
                                type="color"
                                value={theme.muted}
                                onChange={(event) => setTheme((prev) => ({ ...prev, muted: event.target.value }))}
                            />
                        </label>
                        <label className="profile-field">
                            Card
                            <input
                                type="color"
                                value={theme.cardBg}
                                onChange={(event) => setTheme((prev) => ({ ...prev, cardBg: event.target.value }))}
                            />
                        </label>
                        <label className="profile-field">
                            Panel
                            <input
                                type="color"
                                value={theme.panelBg}
                                onChange={(event) => setTheme((prev) => ({ ...prev, panelBg: event.target.value }))}
                            />
                        </label>
                        <label className="profile-field">
                            Buttons
                            <input
                                type="color"
                                value={theme.buttonBg}
                                onChange={(event) => setTheme((prev) => ({ ...prev, buttonBg: event.target.value }))}
                            />
                        </label>
                    </div>

                    <div className="profile-customizer-grid profile-customizer-grid-wide">
                        <label className="profile-field wide">
                            Background image URL
                            <input
                                type="text"
                                value={theme.bgImage}
                                onChange={(event) => setTheme((prev) => ({ ...prev, bgImage: event.target.value }))}
                                placeholder="https://..."
                                className="profile-text-input"
                            />
                        </label>
                        <label className="profile-field wide">
                            Background gradient
                            <select
                                value={theme.bgGradient}
                                onChange={(event) => setTheme((prev) => ({ ...prev, bgGradient: event.target.value }))}
                            >
                                <option value="linear-gradient(130deg, rgba(10,6,4,0.75), rgba(64,36,18,0.85))">
                                    Smoked amber
                                </option>
                                <option value="linear-gradient(135deg, rgba(6,12,10,0.9), rgba(18,60,48,0.85))">
                                    Verdant shadow
                                </option>
                                <option value="linear-gradient(140deg, rgba(8,8,16,0.9), rgba(40,28,72,0.88))">
                                    Arcane night
                                </option>
                                <option value="linear-gradient(135deg, rgba(255,242,224,0.85), rgba(218,170,110,0.82))">
                                    Sunlit vellum
                                </option>
                                <option value="linear-gradient(120deg, rgba(15,20,30,0.82), rgba(10,10,10,0.9))">
                                    Inked steel
                                </option>
                            </select>
                        </label>
                    </div>
                </section>

                <div className="row mt-5">
                    <div className="col-12">
                        <div className="allies-section">
                            <h3 className="mb-3">Your Allies</h3>

                            {friends.length === 0 ? (
                                <>
                                    <p>You have no allies yet.</p>
                                    <button className="btn btn-primary" onClick={openFriendSearch}>
                                        Add Friend
                                    </button>
                                    <button className="btn btn-outline-secondary position-relative" onClick={toggleFriendRequestsModal}>
                                        Requests
                                        {friendRequests.length > 0 && (
                                            <span className="friend-request-badge">{friendRequests.length}</span>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="btn btn-primary mb-3" onClick={openFriendSearch}>
                                        Add Friend
                                    </button>
                                    <button className="btn btn-outline-secondary position-relative mb-3" onClick={toggleFriendRequestsModal}>
                                        Requests
                                        {friendRequests.length > 0 && (
                                            <span className="friend-request-badge">{friendRequests.length}</span>
                                        )}
                                    </button>
                                    <Link to="/friends" className="btn btn-primary mb-3">
                                        Friends Page
                                    </Link>
                                    <ul className="friends-list list-unstyled">
                                        {friends.map(friend => (
                                            <li key={friend.id} className="friend d-flex align-items-center mb-3">
                                                <img
                                                    src={toAbsUrl(friend.profilePicture || friend.profile_picture || "/defaults/profile_picture.jpg")}
                                                    alt="Friend"
                                                    className="friend-pic rounded-circle"
                                                />
                                                <span className="ms-2 flex-grow-1">{friend.username}</span>
                                                <button
                                                    className="btn btn-danger btn-sm me-2"
                                                    onClick={() => removeFriend(friend.id)}
                                                >
                                                    Remove
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => alert(`Open chat with ${friend.username}`)}
                                                >
                                                    Chat
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {modalVisible && (
                <div className="profile-modal">
                    <div className="profile-modal-content">
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <h2>Select a Profile Picture</h2>
                        <label className="btn btn-primary mb-3">
                            Upload your own
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleUploadProfilePicture}
                            />
                        </label>
                        <div className="image-options d-flex flex-wrap gap-2">
                            {["profile1.jpg", "profile2.jpg", "profile3.jpg"].map(img => (
                                <img
                                    key={img}
                                    src={`/defaults/${img}`}
                                    alt="Default Profile"
                                    className="selectable-pic"
                                    onClick={() => selectImage(img)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {friendSearchModal && (
                <div className="profile-modal">
                    <div className="profile-modal-content">
                        <span className="close-btn" onClick={closeFriendSearch}>&times;</span>
                        <h2>Search for Friends</h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter username"
                            className="form-control mb-2"
                        />
                        <button className="btn btn-primary mb-3" onClick={handleSearch}>
                            Search
                        </button>
                        {loadingSearch && <p>Searching...</p>}
                        <ul className="list-unstyled">
                            {searchResults.map(user => (
                                <li key={user.id} className="d-flex align-items-center mb-2">
                                    <span className="flex-grow-1">{user.username}</span>
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => sendFriendRequest(user.username)}
                                    >
                                        Add
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {friendRequestsModal && (
                <div className="profile-modal friend-requests-modal">
                    <div className="profile-modal-content">
                        <span className="close-btn" onClick={toggleFriendRequestsModal}>&times;</span>
                        <h2>Friend Requests</h2>
                        <ul className="list-unstyled friend-requests-list">
                            {friendRequests.map(req => (
                                <li key={req.id} className="d-flex align-items-center mb-2 request-item">
                                    <img
                                        src={toAbsUrl(req.requesterProfilePicture || "/defaults/profile_picture.jpg")}
                                        alt="Sender"
                                        className="friend-request-pic"
                                    />
                                    <span className="flex-grow-1 ms-2">{req.requesterUsername || "Unknown"}</span>
                                    <button
                                        className="btn btn-success btn-sm me-1"
                                        onClick={() => handleFriendRequest(req.id, "accept")}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleFriendRequest(req.id, "deny")}
                                    >
                                        Deny
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
