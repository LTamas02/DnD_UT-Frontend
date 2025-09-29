
import React from "react";
import "../assets/styles/Navbar.css"; // Import your CSS file for styling
import {href, Link} from "react-router-dom";
import ppic from "../assets/img/profile_picture.jpg"; // Default profile picture

const Navbar = ({username, profilePicture}) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid">
                <Link
                    to="/"
                    className="navbar-brand"
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
                            <Link to="/characters" className="nav-link active">
                                Characters
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/wiki" className="nav-link active">
                                Wiki
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/dmtools" className="nav-link active">
                                DM Tools
                            </Link>
                        </li>
                    </ul>
                    <form className="d-flex">
                        <Link to="/profile" className="btn btn-outline-warning me-2">
                            <img
                                className="profKep"
                                id="profkep"
                                src={localStorage.getItem("profilePicture") ?? ppic}
                                style={{ width: "30px", height: "30px", borderRadius: "50%" }}
                            />
                            {localStorage.getItem("username") || "Profile"}
                        </Link>
                    </form>
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

export {Navbar, NavbarLogin};

