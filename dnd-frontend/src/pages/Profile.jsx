import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Profile.css";
import 'bootstrap/dist/css/bootstrap.css';
import "../assets/styles/Login.css";
import "../assets/styles/Footer.css";

import Footer from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { getUser, getFriends, deleteFriend } from "../Api";

const Profile = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [profilePic, setProfilePic] = useState("/defaults/profile_picture.jpg");
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate("/logreg");
            return;
        }

        // Fetch user data
        getUser(token)
            .then(res => {
                setUser(res.data);
                setProfilePic(res.data.profilePicture || "/defaults/profile_picture.jpg");
            })
            .catch(err => console.error("Error loading user:", err));

        // Fetch friends
        getFriends(token)
            .then(res => setFriends(res.data || []))
            .catch(err => console.error("Error loading friends:", err));
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

    const selectImage = (imageName) => {
        if (!window.confirm("Are you sure you want to select this picture?")) return;
        setProfilePic(`/defaults/${imageName}`);
        closeModal();
    };

    return (
        <div id="profile-comp">
            <Navbar />

            <div className="container">
                <div className="profile-box">
                    <img src={profilePic} alt="Profile" className="profile-pic" />
                    <h2 className="username">{user?.username || "Loading..."}</h2>
                    <button className="btn btn-outline-primary mt-2" onClick={openModal}>
                        Change Picture
                    </button>
                    <button className="btn btn-outline-danger mt-2 ms-2" onClick={logout}>
                        Logout
                    </button>
                </div>

                {/* Friends List */}
                <div className="friendlist-sidebar">
                    <h3>Your Allies</h3>
                    <ul className="friends-list list-unstyled">
                        {friends.map(friend => (
                            <li key={friend.id} className="friend d-flex align-items-center mb-3">
                                <img
                                    src={friend.profile_picture || "/defaults/profile_picture.jpg"}
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
                </div>
            </div>

            <Footer />

            {/* Modal for changing profile picture */}
            {modalVisible && (
                <div className="modal d-block">
                    <div className="modal-content">
                        <span className="close-btn" onClick={closeModal}>
                            ×
                        </span>
                        <h2>Select a Profile Picture</h2>
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
        </div>
    );
};

export default Profile;
