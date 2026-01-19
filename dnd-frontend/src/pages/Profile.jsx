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
    updateProfilePictureFile
} from "../Api";

const API_BASE = "https://api.dnd-tool.com";

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

    return (
        <div id="profile-comp">

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
