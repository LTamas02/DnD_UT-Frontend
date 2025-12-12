import 'bootstrap/dist/css/bootstrap.css';
import '../assets/styles/Login.css';
import React, { useState, useEffect, useRef } from 'react';
import { sha256 } from 'js-sha256';
import api, { register, login, getSalt, saltSend } from '../Api';
import Footer from '../components/Footer';
import { NavbarLogin } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const LogReg = ({ setUsername, setProfilePicture, setIsAuthenticated }) => {
    const [errorMessage, setErrorMessage] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register states
    const [registerUsername, setRegisterUsername] = useState('');
    const [validUsername, setValidUsername] = useState(false);

    const [registerEmail, setRegisterEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);

    const [pwd, setPwd] = useState('');
    const [validPwd, setValidPwd] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);

    const userRef = useRef();
    const errRef = useRef();

    const navigate = useNavigate();

    useEffect(() => {
        userRef.current?.focus();
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
    }, [email, password, registerUsername, registerEmail, pwd, matchPwd]);

    // ==============================
    // SALT + SHA256(password + salt)
    // ==============================
    function computeClientHash(password, salt) {
        return sha256(password + salt);
    }

    function generateSalt() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // ==============================
    // LOGIN
    // ==============================
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setErrorMessage("Please enter both email and password.");
            return;
        }

        try {
            const saltResponse = await getSalt(email);
            const salt = saltResponse.data?.salt;

            if (!salt) {
                setErrorMessage("Salt not found for this user.");
                return;
            }

            const clientHash = computeClientHash(password, salt);
            const response = await login(email, clientHash);
            console.log(clientHash);
            const token = response.data?.token;
            if (!token) {
                setErrorMessage("Login failed: No token received.");
                return;
            }

            localStorage.setItem("token", token);

            setIsAuthenticated(true);
            setEmail('');
            setPassword('');

            navigate("/");
        } catch (error) {
            const msg = error.response?.data || error.message;
            setErrorMessage("Login failed: " + msg);
        }
    };

    // ==============================
    // REGISTER
    // ==============================
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!validUsername || !validEmail || !validPwd || !validMatch) {
            setErrorMessage("Please complete all fields correctly.");
            return;
        }

        try {
            const salt = generateSalt();
            const clientHash = computeClientHash(pwd, salt);

            await register(registerEmail, registerUsername, clientHash);
            await saltSend(registerEmail, salt);

            setRegisterUsername('');
            setRegisterEmail('');
            setPwd('');
            setMatchPwd('');

            alert("Registration successful! Please log in.");
            toggleForms();
        } catch (error) {
            const msg = error.response?.data || error.message;
            setErrorMessage("Registration failed: " + msg);
        }
    };

    const toggleForms = () => {
        const signInForm = document.getElementById('signIn');
        const signUpForm = document.getElementById('signUp');

        if (signInForm.style.display === 'block') {
            signInForm.style.display = 'none';
            signUpForm.style.display = 'block';
        } else {
            signUpForm.style.display = 'none';
            signInForm.style.display = 'block';
        }

        setErrorMessage('');
    };

    return (
        <div id="login-comp">
            <NavbarLogin />

            <p ref={errRef} className={errorMessage ? 'errmsg' : "offscreen"} aria-live="assertive">
                {errorMessage}
            </p>

            <div className="container my-5" id="authForm">

                {/* LOGIN FORM */}
                <div id="signIn" style={{ display: 'block' }}>
                    <h1 className="form-title mb-4">Sign In</h1>

                    <form onSubmit={handleLoginSubmit}>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                            <input type="email" className="form-control" placeholder="Email"
                                required ref={userRef} value={email} onChange={e => setEmail(e.target.value)} />
                        </div>

                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input type="password" className="form-control" placeholder="Password"
                                required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        <input type="submit" className="btn btn-success w-100" value="Sign In" />
                        <p className="or">---------or---------</p>

                        <div className="links text-center">
                            <p>Don't have an account yet?</p>
                            <button type="button" className="btn valtas" onClick={toggleForms}>Register</button>
                        </div>
                    </form>
                </div>

                {/* REGISTER FORM */}
                <div id="signUp" style={{ display: 'none' }}>
                    <h1 className="form-title mb-4">Sign Up</h1>

                    <form onSubmit={handleRegisterSubmit}>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-user"></i></span>
                            <input type="text" className="form-control" placeholder="Username"
                                required value={registerUsername} onChange={e => setRegisterUsername(e.target.value)} />
                        </div>

                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                            <input type="email" className="form-control" placeholder="Email"
                                required value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} />
                        </div>

                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input type="password" className="form-control" placeholder="Password"
                                required value={pwd} onChange={e => setPwd(e.target.value)} />
                        </div>

                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input type="password" className="form-control" placeholder="Confirm Password"
                                required value={matchPwd} onChange={e => setMatchPwd(e.target.value)} />
                        </div>

                        <input type="submit" className="btn btn-success w-100" value="Sign Up"
                            disabled={!validUsername || !validEmail || !validPwd || !validMatch} />

                        <p className="or">---------or---------</p>

                        <div className="links text-center">
                            <p>Already have an account?</p>
                            <button type="button" className="btn valtas" onClick={toggleForms}>Login</button>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LogReg;
