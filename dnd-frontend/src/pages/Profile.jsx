
import "../assets/styles/Profile.css";
import 'bootstrap/dist/css/bootstrap.css';
import '../assets/styles/Login.css';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Footer from '../components/Footer';
import "../assets/styles/Footer.css";
import { Navbar } from '../components/Navbar';
import { Link } from "react-router-dom";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [profilePic, setProfilePic] = useState("./defaults/profile_picture.jpg");

    useEffect(() => {
        // API call for user data
        fetch("https://your-api-url.com/api/user", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                setUser(data);
                setProfilePic(data.profilePicture || "./defaults/profile_picture.jpg");
            })
            .catch((err) => console.error("Error loading user:", err));

        // API call for friends list
        fetch("https://your-api-url.com/api/friends", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => setFriends(data))
            .catch((err) => console.error("Error loading friends:", err));
    }, []);

    const logout = () => {
        fetch("https://your-api-url.com/api/logout", { method: "POST", credentials: "include" })
            .then(() => {
                navigate("/login");
            })
            .catch((err) => console.error("Logout error:", err));
    };

    return (
        <div id="profile-comp">
        <Navbar/>
        <div className="container">
            <div className="profile-box">
                <img src={profilePic} alt="Profile" className="profile-pic" />
                <h2 className="username">{user?.username || "Loading..."}</h2>
                <button className="change-pic-btn" onClick={() => openModal()}>Change Picture</button>
                <button className="logout-btn" onClick={logout}>Logout</button>
            </div>

{/* Friends List Sidebar */}
                <div
                    className="friendlist-sidebar"
                >
                    <h3>Your Allies</h3>
                    <ul className="friends-list">
                        {friends.map((friend) => (
                            <li key={friend.id} className="friend d-flex align-items-center mb-3">
                                <img src={friend.profile_picture} alt="Friend" className="friend-pic" />
                                <span className="ms-2 flex-grow-1">{friend.username}</span>
                                <button className="btn btn-danger btn-sm me-2">Remove</button>
                                <button className="btn btn-primary btn-sm"
                                    onClick={() => alert(`Open chat with ${friend.username}`)}>
                                    Chat
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>        </div>
        <Footer/>
        </div>
    );
};

export default Profile;
const selectImage = (imageName) => {
    if (window.confirm("Are you sure you want to select this picture?")) {
        fetch("https://your-api-url.com/api/user/update-profile-picture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile_picture: imageName }),
            credentials: "include"
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setProfilePic(`../defaults/${imageName}`);
                closeModal();
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch((err) => console.error("Error updating profile picture:", err));
    }
};
const openModal = () => document.getElementById("pictureModal").style.display = "block";
const closeModal = () => document.getElementById("pictureModal").style.display = "none";
<div id="pictureModal" className="modal">
    <div className="modal-content">
        <span className="close-btn" onClick={closeModal}>X</span>
        <h2>Select a Profile Picture</h2>
        <div className="image-options">
            {["profile1.jpg", "profile2.jpg", "profile3.jpg"].map((img) => (
                <img key={img} src={`../defaults/${img}`} alt="Default Profile" onClick={() => selectImage(img)} />
            ))}
        </div>
    </div>
</div>

const setProfilePic = (newPic) => {
    // Set the new profile picture
    setProfilePic(`../defaults/${newPic}`);
};
