
import React from "react";
import "../assets/styles/Navbar.css"; // Import your CSS file for styling
import { Link } from "react-router-dom";
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

const API_BASE = "https://api.dnd-tool.com";

const toAbsUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const localKey = url.replace(/^\/defaults\//, "");
    if (profileImageMap[localKey]) return profileImageMap[localKey];
    if (url.startsWith("/uploads/")) return `${API_BASE}${url}`;
    return url;
};

const Navbar = ({ username, profilePicture }) => {
    const displayName = username || localStorage.getItem("username") || "Profile";
    const storedPicture = localStorage.getItem("profilePicture");
    const displayPicture = profilePicture || storedPicture || DEFAULT_PROFILE_IMAGE;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid">
                <Link
                    to="/"
                    className="navbar-brand"
                    data-tutorial="nav-home"
                    style={{
                        color: "rgb(255, 0, 0)",
                        backgroundColor: "black",
                        padding: "10px 20px",
                        borderRadius: "25px",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: "bold"
                    }}
                >
                    D&D Ultimate Tool
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link to="/characters" className="nav-link active" data-tutorial="nav-characters">
                                Characters
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/wiki" className="nav-link active" data-tutorial="nav-wiki">
                                Wiki
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/books" className="nav-link active" data-tutorial="nav-books">
                                Books
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/dmtools" className="nav-link active" data-tutorial="nav-dmtools">
                                DM Tools
                            </Link>
                        </li>
                        <li className="nav-item">
                        </li>
                    </ul>
                    <form className="d-flex">
                        <Link to="/profile" className="btn btn-outline-warning me-2" data-tutorial="nav-profile">
                            <img
                                className="profKep"
                                id="profkep"
                                src={toAbsUrl(displayPicture)}
                                style={{ width: "30px", height: "30px", borderRadius: "50%" }}
                                alt=""
                            />
                            {displayName}
                        </Link>
                    </form>
                </div>
            </div>
        </nav>
    );
};

const NavbarProfile = ({ username, profilePicture }) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid">
                <Link
                    to="/"
                    className="navbar-brand"
                    data-tutorial="nav-home"
                    style={{
                        color: "rgb(255, 0, 0)",
                        backgroundColor: "black",
                        padding: "10px 20px",
                        borderRadius: "25px",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: "bold"
                    }}
                >
                    D&D Ultimate Tool
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link to="/characters" className="nav-link active" data-tutorial="nav-characters">
                                Characters
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/wiki" className="nav-link active" data-tutorial="nav-wiki">
                                Wiki
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/books" className="nav-link active" data-tutorial="nav-books">
                                Books
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/dmtools" className="nav-link active" data-tutorial="nav-dmtools">
                                DM Tools
                            </Link>
                        </li>                        
                        <li className="nav-item">
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

const NavbarLogin= () => {
    return (
        <div className="navbar-login-emblem">
            <div
                style={{
                    color: "rgb(255, 0, 0)",
                    backgroundColor: "black",
                    padding: "10px 20px",
                    borderRadius: "25px",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: "bold",
                    textAlign: "center",
                    display: "inline-block"
                }}
            >
                D&D Ultimate Tool
            </div>
        </div>
    );
};

export {Navbar, NavbarLogin, NavbarProfile};


