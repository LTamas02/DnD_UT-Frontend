import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Profile.css";
import "bootstrap/dist/css/bootstrap.css";
import "../assets/styles/Login.css";
import "../assets/styles/Footer.css";
import Footer from "../components/Footer";
import DirectMessagePopup from "../components/DirectMessagePopup";
import { sha256 } from "js-sha256";
import {
    getUser,
    getFriends,
    deleteFriend,
    searchFriends,
    addFriend,
    blockFriend,
    unblockFriend,
    getSalt,
    getFriendRequests,
    respondFriendRequest,
    updateProfile,
    updateProfilePicture,
    updateProfilePictureFile,
    getProfileTheme,
    updateProfileTheme
} from "../assets/api/profileapi";
import { DEFAULT_THEME, THEME_KEY, applyTheme } from "../theme";

const API_BASE = "https://api.dnd-tool.com";
const THEME_PRESETS = [
    {
        id: "ember",
        name: "Ember Hearth",
        theme: {
            bgGradient: "linear-gradient(135deg, rgba(18,10,8,0.88), rgba(72,26,14,0.94))",
            pageBg: "#2b1611",
            overlay: "rgba(6,4,3,0.45)",
            accent: "#ffb36b",
            text: "#ffe8d3",
            muted: "#d8a97a",
            cardBg: "linear-gradient(180deg, rgba(38,20,16,0.92), rgba(34,16,12,0.8))",
            cardBorder: "rgba(255,179,107,0.12)",
            panelBg: "rgba(30,12,8,0.65)",
            panelText: "#ffe8d3",
            buttonBg: "#8a4f39",
            buttonText: "#fff7ef",
            buttonBorder: "rgba(0,0,0,0.15)",
            buttonHover: "#a05a42",
            friendBg: "rgba(88,39,24,0.18)",
            dmtoolsMapBg: "#2b1611",
            dmtoolsPanelBg: "#3b2417"
        }
    },
    {
        id: "forest",
        name: "Wyrdwood",
        theme: {
            bgGradient: "linear-gradient(140deg, rgba(6,12,10,0.92), rgba(16,54,42,0.9))",
            pageBg: "#081611",
            overlay: "rgba(4,10,8,0.5)",
            accent: "#7ce0b4",
            text: "#dffbf0",
            muted: "#9fd1bf",
            cardBg: "#122a24",
            cardBorder: "rgba(124,224,180,0.06)",
            panelBg: "linear-gradient(180deg, rgba(20,40,34,0.7), rgba(14,28,24,0.6))",
            panelText: "#dffbf0",
            buttonBg: "#2f6a56",
            buttonText: "#eefbf6",
            buttonBorder: "rgba(0,0,0,0.12)",
            buttonHover: "#3f7d68",
            friendBg: "#16382f",
            dmtoolsMapBg: "#081611",
            dmtoolsPanelBg: "#122a24"
        }
    },
    {
        id: "midnight",
        name: "Night Ledger",
        theme: {
            bgGradient: "linear-gradient(140deg, rgba(10,8,18,0.9), rgba(44,30,80,0.92))",
            pageBg: "#0e0b16",
            overlay: "rgba(6,6,12,0.56)",
            accent: "#f0b9ff",
            text: "#fbecff",
            muted: "#d9c2e8",
            cardBg: "#271f34",
            cardBorder: "rgba(240,185,255,0.06)",
            panelBg: "rgba(28,20,44,0.78)",
            panelText: "#f3e8ff",
            buttonBg: "#4a3370",
            buttonText: "#fff6ff",
            buttonBorder: "rgba(0,0,0,0.14)",
            buttonHover: "#5a4286",
            friendBg: "#2b2340",
            dmtoolsMapBg: "#0e0b16",
            dmtoolsPanelBg: "#271f34"
        }
    },
    {
        id: "sunlit",
        name: "Sunlit Archive",
        theme: {
            bgGradient: "linear-gradient(135deg, rgba(255,245,230,0.9), rgba(220,180,120,0.9))",
            pageBg: "#f7e9d7",
            overlay: "rgba(255,246,236,0.45)",
            accent: "#7c2f1c",
            text: "#3b1f14",
            muted: "#8f6f57",
            cardBg: "#fff8f1",
            cardBorder: "#e6c9a4",
            panelBg: "rgba(250,240,230,0.6)",
            panelText: "#3b1f14",
            buttonBg: "#8b4a33",
            buttonText: "#fff1df",
            buttonBorder: "rgba(0,0,0,0.06)",
            buttonHover: "#a15b41",
            friendBg: "#f3dfc8",
            dmtoolsMapBg: "#f7e9d7",
            dmtoolsPanelBg: "#fff8f1"
        }
    }
];

const profileImages = require.context("../assets/img/profile", false, /\.(png|jpe?g|gif|svg)$/);
const PROFILE_IMAGE_OPTIONS = profileImages.keys().map((key) => ({
    name: key.replace("./", ""),
    src: profileImages(key)
}));
const profileImageMap = PROFILE_IMAGE_OPTIONS.reduce((acc, image) => {
    acc[image.name] = image.src;
    return acc;
}, {});
const DEFAULT_PROFILE_IMAGE = profileImageMap["profile_picture.jpg"] || PROFILE_IMAGE_OPTIONS[0]?.src || "";

const toAbsUrl = (url) => {
    if (!url || typeof url !== "string") return DEFAULT_PROFILE_IMAGE;
    const localKey = url.replace(/^\/defaults\//, "");
    if (profileImageMap[localKey]) return profileImageMap[localKey];
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
    return url;
};

const Profile = ({ onStartTutorial }) => {
    const navigate = useNavigate();
    const rawToken = localStorage.getItem("token");
    const token = rawToken && rawToken !== "undefined" && rawToken !== "null" ? rawToken : null;

    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [profilePic, setProfilePic] = useState(DEFAULT_PROFILE_IMAGE);
    const [activeChat, setActiveChat] = useState(null);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState("profile");
    const [settingsError, setSettingsError] = useState("");
    const [settingsNote, setSettingsNote] = useState("");
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [profileForm, setProfileForm] = useState({ username: "", email: "" });
    const [passwordForm, setPasswordForm] = useState({
        current: "",
        next: "",
        confirm: ""
    });
    const [friendSearchModal, setFriendSearchModal] = useState(false);
    const [friendRequestsModal, setFriendRequestsModal] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const themeReadyRef = React.useRef(false);
    const themeSaveTimerRef = React.useRef(null);
    const themeRef = React.useRef(theme);

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
                    DEFAULT_PROFILE_IMAGE
                );
            })
            .catch(err => {
                if (err?.response?.status === 401) {
                    logout();
                    return;
                }
                console.error("Error loading user:", err);
            });

        getFriends(token)
            .then(res => setFriends(res.data || []))
            .catch(err => console.error("Error loading friends:", err));

        getFriendRequests(token)
            .then(res => setFriendRequests(res.data || []))
            .catch(err => console.error("Error loading friend requests:", err));
    }, [token, navigate]);

    useEffect(() => {
        if (!user) return;
        setProfileForm({
            username: user.username || "",
            email: user.email || ""
        });
    }, [user]);

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
        themeRef.current = theme;
        localStorage.setItem(THEME_KEY, JSON.stringify(theme));
        applyTheme(theme);
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
                    updateProfileTheme(token, themeRef.current).catch(err =>
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

    const computeClientHash = (plainPassword, salt) => sha256(plainPassword + salt);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/logreg");
    };

    const removeFriend = (friendId) => {
        if (!window.confirm("Are you sure you want to remove this friend?")) return;

        deleteFriend(token, friendId)
            .then(() => {
                setFriends((prev) => prev.filter(f => f.id !== friendId));
            })
            .catch(err => console.error("Error removing friend:", err));
    };

    const refreshFriends = () => {
        getFriends(token)
            .then((res) => setFriends(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error("Error loading friends:", err));
    };

    const toggleBlockFriend = (friend) => {
        const isBlocked = !!(friend?.blocked ?? friend?.isBlocked);
        const username = friend?.username || "this user";
        const message = isBlocked
            ? `Are you sure you want to unblock ${username}?`
            : `Are you sure you want to block ${username}?`;
        if (!window.confirm(message)) return;

        const action = isBlocked
            ? unblockFriend(token, friend.id)
            : blockFriend(token, friend.id);

        action
            .then(() => {
                if (!isBlocked && activeChat?.id === friend.id) {
                    setActiveChat(null);
                }
                refreshFriends();
            })
            .catch((err) => console.error(`${isBlocked ? "Unblock" : "Block"} friend error:`, err));
    };

    const openSettings = () => {
        setSettingsOpen(true);
        setSettingsTab("profile");
        setSettingsError("");
        setSettingsNote("");
    };
    const closeSettings = () => setSettingsOpen(false);

    const openFriendSearch = () => setFriendSearchModal(true);
    const closeFriendSearch = () => setFriendSearchModal(false);

    const toggleFriendRequestsModal = () => setFriendRequestsModal(!friendRequestsModal);

    const selectImage = async (imageName) => {
        if (!window.confirm("Are you sure you want to select this picture?")) return;
        const nextPicture = `/defaults/${imageName}`;
        try {
            await updateProfilePicture(token, nextPicture);
            setProfilePic(nextPicture);
            localStorage.setItem("profilePicture", nextPicture);
            setUser((prev) => (prev ? { ...prev, profilePictureUrl: nextPicture } : prev));
            setSettingsNote("Profile picture updated.");
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
            localStorage.setItem("profilePicture", nextPicture);
            setUser((prev) => (prev ? { ...prev, profilePictureUrl: nextPicture } : prev));
            setSettingsNote("Profile picture updated.");
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

    const handleSaveProfile = async () => {
        if (!token || !user) return;
        setSettingsError("");
        setSettingsNote("");

        const nextUsername = profileForm.username.trim();
        const nextEmail = profileForm.email.trim();
        const payload = {};

        if (nextUsername && nextUsername !== user.username) {
            payload.username = nextUsername;
        }
        if (nextEmail && nextEmail !== user.email) {
            payload.email = nextEmail;
        }

        if (Object.keys(payload).length === 0) {
            setSettingsNote("No profile changes to save.");
            return;
        }

        if (payload.email && !passwordForm.current) {
            setSettingsError("Current password is required to change email.");
            return;
        }

        setSettingsSaving(true);
        try {
            if (payload.email) {
                const saltRes = await getSalt(user.email);
                const salt = saltRes?.data?.salt;
                if (!salt) {
                    setSettingsError("Salt not found for this account.");
                    setSettingsSaving(false);
                    return;
                }
                payload.currentPassword = computeClientHash(passwordForm.current, salt);
            }

            const res = await updateProfile(token, payload);
            if (res?.data) {
                setUser(res.data);
                setProfileForm({
                    username: res.data.username || "",
                    email: res.data.email || ""
                });
                localStorage.setItem("username", res.data.username || "");
            }
            setSettingsNote("Profile updated.");
        } catch (err) {
            const msg = err?.response?.data || "Failed to update profile.";
            setSettingsError(msg);
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!token || !user) return;
        setSettingsError("");
        setSettingsNote("");

        if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
            setSettingsError("Fill in all password fields.");
            return;
        }

        if (passwordForm.next !== passwordForm.confirm) {
            setSettingsError("New password and confirmation do not match.");
            return;
        }

        setSettingsSaving(true);
        try {
            const saltRes = await getSalt(user.email);
            const salt = saltRes?.data?.salt;
            if (!salt) {
                setSettingsError("Salt not found for this account.");
                setSettingsSaving(false);
                return;
            }

            const payload = {
                currentPassword: computeClientHash(passwordForm.current, salt),
                newPassword: computeClientHash(passwordForm.next, salt)
            };

            await updateProfile(token, payload);
            setPasswordForm({ current: "", next: "", confirm: "" });
            setSettingsNote("Password updated.");
        } catch (err) {
            const msg = err?.response?.data || "Failed to update password.";
            setSettingsError(msg);
        } finally {
            setSettingsSaving(false);
        }
    };

    const themeVars = {
        "--profile-bg-image": theme.bgImage ? `url("${theme.bgImage}")` : undefined,
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

    if (!theme.bgImage) {
        delete themeVars["--profile-bg-image"];
    }

    return (
        <div id="profile-comp" style={themeVars}>

            <div className="container profile-shell">
                <div className="row justify-content-center">
                    <div className="col-md-12">
                        <div className="profile-box text-center">
                            <img
                                src={toAbsUrl(profilePic)}
                                alt="Profile"
                                className="profile-pic mb-3"
                            />
                            <h2 className="username">{user?.username || "Loading..."}</h2>
                            <div className="d-flex justify-content-center gap-2 mt-2 profile-actions">
                                <button className="btn btn-outline-primary" onClick={openSettings}>
                                    Settings
                                </button>
                            <button className="btn btn-outline-danger" onClick={logout}>
                                Logout
                            </button>
                            <button
                                className="btn btn-outline-info"
                                onClick={() => onStartTutorial?.()}
                            >
                                Restart tutorial
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
                            DM Tools Map
                            <input
                                type="color"
                                value={theme.dmtoolsMapBg}
                                onChange={(event) =>
                                    setTheme((prev) => ({ ...prev, dmtoolsMapBg: event.target.value }))
                                }
                            />
                        </label>
                        <label className="profile-field">
                            DM Tools Panel
                            <input
                                type="color"
                                value={theme.dmtoolsPanelBg}
                                onChange={(event) =>
                                    setTheme((prev) => ({ ...prev, dmtoolsPanelBg: event.target.value }))
                                }
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
                                    <ul className="friends-list list-unstyled">
                                        {friends.map(friend => {
                                            const isBlocked = !!(friend.blocked ?? friend.isBlocked);
                                            return (
                                            <li key={friend.id} className="friend d-flex align-items-center mb-3">
                                                <img
                                                    src={toAbsUrl(friend.profilePictureUrl || friend.profilePicture || friend.profile_picture || DEFAULT_PROFILE_IMAGE)}
                                                    alt="Friend"
                                                    className="friend-pic rounded-circle"
                                                />
                                                <div className="ms-2 flex-grow-1">
                                                    <span className="friend-name">{friend.username}</span>
                                                    {isBlocked && (
                                                        <div className="profile-settings-hint">Blocked</div>
                                                    )}
                                                </div>
                                                <div className="friend-actions">
                                                    <button
                                                        className="friend-action danger"
                                                        onClick={() => removeFriend(friend.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                    <button
                                                        className={`friend-action ${isBlocked ? "" : "danger"}`}
                                                        onClick={() => toggleBlockFriend(friend)}
                                                    >
                                                        {isBlocked ? "Unblock" : "Block"}
                                                    </button>
                                                    <button
                                                        className="friend-action"
                                                        onClick={() => setActiveChat(friend)}
                                                        disabled={isBlocked}
                                                        title={isBlocked ? "Unblock to chat" : "Open chat"}
                                                    >
                                                        Chat
                                                    </button>
                                                </div>
                                            </li>
                                        )})}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {settingsOpen && (
                <div className="profile-modal profile-settings-modal">
                    <div className="profile-modal-content profile-settings-card">
                        <span className="close-btn" onClick={closeSettings}>&times;</span>
                        <div className="profile-settings-header">
                            <div>
                                <h2>Settings</h2>
                                <p>Update your account, theme, and avatar.</p>
                            </div>
                            <div className="profile-settings-status">
                                {settingsError && (
                                    <div className="profile-settings-alert is-error">
                                        {settingsError}
                                    </div>
                                )}
                                {settingsNote && (
                                    <div className="profile-settings-alert">
                                        {settingsNote}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="profile-settings-tabs">
                            {[
                                { id: "profile", label: "Profile" },
                                { id: "security", label: "Security" },
                                { id: "theme", label: "Theme" },
                                { id: "picture", label: "Picture" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`profile-settings-tab ${
                                        settingsTab === tab.id ? "is-active" : ""
                                    }`}
                                    onClick={() => {
                                        setSettingsTab(tab.id);
                                        setSettingsError("");
                                        setSettingsNote("");
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="profile-settings-body">
                            {settingsTab === "profile" && (
                                <div className="profile-settings-section">
                                    <h3>Account Info</h3>
                                    <div className="profile-form-grid">
                                        <label className="profile-form-field">
                                            Username
                                            <input
                                                type="text"
                                                value={profileForm.username}
                                                onChange={(event) =>
                                                    setProfileForm((prev) => ({
                                                        ...prev,
                                                        username: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-form-field">
                                            Email
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(event) =>
                                                    setProfileForm((prev) => ({
                                                        ...prev,
                                                        email: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-form-field">
                                            Current password
                                            <input
                                                type="password"
                                                value={passwordForm.current}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        current: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                    <p className="profile-settings-hint">
                                        Current password is required to change email.
                                    </p>
                                    <button
                                        className="profile-action primary"
                                        onClick={handleSaveProfile}
                                        disabled={settingsSaving}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}

                            {settingsTab === "security" && (
                                <div className="profile-settings-section">
                                    <h3>Change Password</h3>
                                    <div className="profile-form-grid">
                                        <label className="profile-form-field">
                                            Current password
                                            <input
                                                type="password"
                                                value={passwordForm.current}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        current: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-form-field">
                                            New password
                                            <input
                                                type="password"
                                                value={passwordForm.next}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        next: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-form-field">
                                            Confirm new password
                                            <input
                                                type="password"
                                                value={passwordForm.confirm}
                                                onChange={(event) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        confirm: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                    <button
                                        className="profile-action primary"
                                        onClick={handleUpdatePassword}
                                        disabled={settingsSaving}
                                    >
                                        Update Password
                                    </button>
                                </div>
                            )}

                            {settingsTab === "theme" && (
                                <section className="profile-customizer profile-customizer-modal">
                                    <div className="profile-customizer-header">
                                        <div>
                                            <h3>Theme Forge</h3>
                                            <p>Customize colors, background, and surfaces.</p>
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
                                                onClick={() =>
                                                    setTheme((prev) => ({ ...prev, ...preset.theme }))
                                                }
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
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        accent: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            Text
                                            <input
                                                type="color"
                                                value={theme.text}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        text: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            Muted
                                            <input
                                                type="color"
                                                value={theme.muted}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        muted: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            Card
                                            <input
                                                type="color"
                                                value={theme.cardBg}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        cardBg: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            Panel
                                            <input
                                                type="color"
                                                value={theme.panelBg}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        panelBg: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            DM Tools Map
                                            <input
                                                type="color"
                                                value={theme.dmtoolsMapBg}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        dmtoolsMapBg: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            DM Tools Panel
                                            <input
                                                type="color"
                                                value={theme.dmtoolsPanelBg}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        dmtoolsPanelBg: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                        <label className="profile-field">
                                            Buttons
                                            <input
                                                type="color"
                                                value={theme.buttonBg}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        buttonBg: event.target.value
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>

                                    <div className="profile-customizer-grid profile-customizer-grid-wide">
                                        <label className="profile-field wide">
                                            Background image URL
                                            <input
                                                type="text"
                                                value={theme.bgImage}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        bgImage: event.target.value
                                                    }))
                                                }
                                                placeholder="https://..."
                                                className="profile-text-input"
                                            />
                                        </label>
                                        <label className="profile-field wide">
                                            Background gradient
                                            <select
                                                value={theme.bgGradient}
                                                onChange={(event) =>
                                                    setTheme((prev) => ({
                                                        ...prev,
                                                        bgGradient: event.target.value
                                                    }))
                                                }
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
                            )}

                            {settingsTab === "picture" && (
                                <div className="profile-settings-section">
                                    <h3>Profile Picture</h3>
                                    <div className="profile-picture-grid">
                                        <div className="profile-picture-preview">
                                            <img src={toAbsUrl(profilePic)} alt="Profile" />
                                            <span>Current avatar</span>
                                        </div>
                                        <div className="profile-picture-actions">
                                            <label className="profile-action primary">
                                                Upload image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: "none" }}
                                                    onChange={handleUploadProfilePicture}
                                                />
                                            </label>
                                            <p className="profile-settings-hint">
                                                Choose a default crest or upload your own.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="image-options d-flex flex-wrap gap-2">
                                        {PROFILE_IMAGE_OPTIONS.map((img) => (
                                            <img
                                                key={img.name}
                                                src={img.src}
                                                alt="Default Profile"
                                                className="selectable-pic"
                                                onClick={() => selectImage(img.name)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                        src={toAbsUrl(req.requesterProfilePicture || DEFAULT_PROFILE_IMAGE)}
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

            {activeChat && (
                <DirectMessagePopup
                    token={token}
                    meId={user?.id}
                    friend={activeChat}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
};

export default Profile;

