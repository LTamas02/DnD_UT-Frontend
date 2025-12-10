import 'bootstrap/dist/css/bootstrap.css';
import '../assets/styles/Login.css';
import React, { useState, useEffect, useRef } from 'react';
import { sha256 } from 'js-sha256';
import md5 from "md5";
import axios from 'axios';
// === FIX 2 APPLIED: Explicitly importing all API functions ===
import api, { register, login, getSalt, saltSend } from '../Api';
// ==========================================================
import Footer from '../components/Footer';
import { NavbarLogin } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const Login = ({ setUsername, setProfilePicture, setIsAuthenticated }) => {
    const [errorMessage, setErrorMessage] = useState('');

    // Login form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register form states
    const [registerUsername, setRegisterUsername] = useState('');
    const [validUsername, setValidUsername] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [registerEmail, setRegisterEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);

    const [pwd, setPwd] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);

    const userRef = useRef();
    const errRef = useRef();

    const navigate = useNavigate();

    useEffect(() => {
        if (userRef.current) {
            userRef.current.focus();
        }
    }, []);

    useEffect(() => {
        setValidUsername(usernameRegex.test(registerUsername));
    }, [registerUsername]);

    useEffect(() => {
        setValidEmail(emailRegex.test(registerEmail));
    }, [registerEmail]);

    useEffect(() => {
        setValidPwd(passwordRegex.test(pwd));
        setValidMatch(pwd === matchPwd);
    }, [pwd, matchPwd]);

    useEffect(() => {
        setErrorMessage('');
    }, [registerUsername, registerEmail, pwd, matchPwd, email, password]);

    function generateSalt() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function hashPassword(password, salt) {
        const hash = sha256(password);
        return md5(hash + salt);
    }

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        
        // === FIX 1 APPLIED: Client-Side Empty Field Check ===
        if (!email || !password) {
            setErrorMessage("Please enter both email and password.");
            return;
        }
        // ===================================================

        try {
            const saltResponse = await getSalt(email);
            const salt = saltResponse.data?.salt || '';
            const hashedPassword = hashPassword(password, salt);
            const response = await login(email, hashedPassword);

            const token = response.data?.token;
            const user = response.data?.user ?? null;

            if (token) {
                localStorage.setItem("token", token);

                if (user) {
                    localStorage.setItem("username", user.username || "");
                    localStorage.setItem("profilePicture", user.profilePicture || "/defaults/profile_picture.jpg");
                }
                
                // Clear login fields on success
                setEmail('');
                setPassword('');

                setIsAuthenticated(true);
                navigate("/");
            } else {
                setErrorMessage("Login failed: No token received.");
            }
        } catch (error) {
            let errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;

            // Improved error parsing
            if (error.response?.status === 400 && error.response?.data?.errors) {
                const validationErrors = Object.values(error.response.data.errors)
                    .map(arr => arr.join(', '))
                    .join('; ');
                errorMsg = `Validation failed: ${validationErrors}`;
            } 
            else if (typeof error.response?.data === "object" && error.response.data !== null) {
                errorMsg = JSON.stringify(error.response.data);
            } else if (typeof error.response?.data === "string") {
                errorMsg = error.response.data;
            }

            setErrorMessage("Login failed: " + (errorMsg || "An unknown error occurred."));
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!validUsername || !validEmail || !validPwd || !validMatch) {
            setErrorMessage("Please ensure username, a valid email, and matching passwords are provided.");
            return;
        }

        try {
            const salt = generateSalt();
            const hashedPassword = hashPassword(pwd, salt);

            const response = await register(registerEmail, registerUsername, hashedPassword);
            if (response && response.data) {
                await saltSend(registerEmail, salt);

                // Clear register fields on success
                setRegisterUsername('');
                setRegisterEmail('');
                setPwd('');
                setMatchPwd('');
                
                setErrorMessage(""); 
                alert("Registration successful! Please log in.");
                toggleForms();
            }
        } catch (error) {
            // === FIX 3 APPLIED: Improved error parsing for 'object object' ===
            let errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;

            if (error.response?.status === 400 && error.response?.data?.errors) {
                const validationErrors = Object.values(error.response.data.errors)
                    .map(arr => arr.join(', '))
                    .join('; ');
                errorMsg = `Validation failed: ${validationErrors}`;
            } 
            else if (typeof error.response?.data === "object" && error.response.data !== null) {
                errorMsg = JSON.stringify(error.response.data);
            } else if (typeof error.response?.data === "string") {
                errorMsg = error.response.data;
            }
            // =================================================================

            setErrorMessage("Registration failed: " + (errorMsg || "An unknown error occurred."));
        }
    };

    const toggleForms = () => {
        const signInForm = document.getElementById('signIn');
        const signUpForm = document.getElementById('signUp');
        if (signInForm.style.display === 'block') {
            signInForm.style.display = 'none';
            signUpForm.style.display = 'block';
            setErrorMessage(''); 
        } else {
            signInForm.style.display = 'block';
            signUpForm.style.display = 'none';
            setErrorMessage(''); 
        }
    };

    return (
        <div id="login-comp">
            <NavbarLogin />

            <p ref={errRef} className={errorMessage ? 'errmsg' : "offscreen"} aria-live="assertive">{errorMessage}</p>

            <div className="container my-5" id="authForm">
                {/* Sign In Form */}
                <div id="signIn" style={{ display: 'block' }}>
                    <h1 className="form-title mb-4" id="formTitle">Sign In</h1>
                    <form method="post" onSubmit={handleLoginSubmit} id="signInForm">
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                id="email"
                                placeholder="Email"
                                required
                                ref={userRef}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input
                                type="password"
                                className="form-control"
                                name="password"
                                id="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <p className="recover">
                            <a href="#">Recover Password</a>
                        </p>
                        <input type="submit" className="btn btn-success w-100" value="Sign In" name="signIn" />
                        <p className="or">---------or---------</p>
                        <div className="links text-center">
                            <p>Don't have an account yet?</p>
                            <button type="button" className="btn valtas" onClick={toggleForms}>Register</button>
                        </div>
                        <p className="mt-5 mb-3 text-center">© 2024–2026</p>
                    </form>
                </div>

                {/* Sign Up Form */}
                <div id="signUp" style={{ display: 'none' }}>
                    <h1 className="form-title mb-4" id="formTitle">Sign Up</h1>
                    <form method="post" id="signUpForm" onSubmit={handleRegisterSubmit}>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-user"></i></span>
                            <input
                                type="text"
                                className="form-control"
                                name="registerUsername"
                                id="registerUsername"
                                placeholder="Username"
                                required
                                autoComplete="off"
                                value={registerUsername}
                                onChange={e => setRegisterUsername(e.target.value)}
                                onFocus={() => setUserFocus(true)}
                                onBlur={() => setUserFocus(false)}
                            />
                        </div>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                            <input
                                type="email"
                                className="form-control"
                                name="registerEmail"
                                id="registerEmail"
                                placeholder="Email"
                                required
                                value={registerEmail}
                                onChange={e => setRegisterEmail(e.target.value)}
                                aria-invalid={validEmail ? "false" : "true"}
                            />
                        </div>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input
                                type="password"
                                className="form-control"
                                name="registerPassword"
                                id="registerPassword"
                                placeholder="Password"
                                required
                                value={pwd}
                                onChange={e => setPwd(e.target.value)}
                                aria-invalid={validPwd ? "false" : "true"}
                                aria-describedby="pwdnote"
                                onFocus={() => setPwdFocus(true)}
                                onBlur={() => setPwdFocus(false)}
                            />
                            <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                                8+ chars, uppercase, lowercase, number, special character.
                            </p>
                        </div>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input
                                type="password"
                                className="form-control"
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="Confirm Password"
                                required
                                value={matchPwd}
                                onChange={e => setMatchPwd(e.target.value)}
                                aria-invalid={validMatch ? "false" : "true"}
                                aria-describedby="confirmnote"
                                onFocus={() => setMatchFocus(true)}
                                onBlur={() => setMatchFocus(false)}
                            />
                            <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                                Must match the first password input field.
                            </p>
                        </div>
                        <input
                            type="submit"
                            className="btn btn-success w-100"
                            value="Sign Up"
                            name="signUp"
                            disabled={!validUsername || !validEmail || !validPwd || !validMatch}
                        />
                        <p className="or">----------or--------</p>
                        <div className="links text-center">
                            <p>Already have an account?</p>
                            <button type="button" className="btn valtas" onClick={toggleForms}>Login</button>
                        </div>
                        <p className="mt-5 mb-3 text-center">© 2024–2026</p>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Login;