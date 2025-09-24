import 'bootstrap/dist/css/bootstrap.css';
import '../assets/styles/Login.css';
import React, { useState, useEffect, useRef } from 'react';
import { sha256 } from 'js-sha256';
import md5 from "md5";
import axios from 'axios';
import api from '../Api';
import Footer from '../components/Footer';
import { NavbarLogin } from '../components/Navbar';

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const Login = () => {

  const [errorMessage, setErrorMessage] = useState('');

  const [username, setUsername] = useState('');
  const [validUsername, setValidUsername] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);

  const [pwd , setPwd] = useState('');
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState('');
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);
const [password, setPassword] = useState('');

const userRef = useRef();
const errRef = useRef();

useEffect(() => {
  if (userRef.current) {
    userRef.current.focus();
  }
}, []);

useEffect(() => {
  const result = usernameRegex.test(username);
  setValidUsername(result);
}, [username]);

useEffect(() => {
  const result = emailRegex.test(email);
  setValidEmail(result);
}, [email]);

useEffect(() => {
  const result = passwordRegex.test(pwd);
  setValidPwd(result);
  const match = pwd === matchPwd;
  setValidMatch(match);
}, [pwd, matchPwd]);

useEffect(() => {
  setErrorMessage('');
}, [username, email, pwd, matchPwd, password]);

useEffect(() => {
  setErrorMessage('');
}, [username, email, password]);


// generate salt
function generateSalt() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + byte.toString(32)).slice(-2)).join('');
}


// sha-256 hash function for password
function hashPassword(password, salt) {
  const hash = sha256(password);
  return md5(hash + salt);
}


const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await api.post("api/Auth/login", {
            email: email,
            password: password
        });

        const token = response.data?.token;
        if (token) {
            localStorage.setItem("token", token);
            alert("Login successful!");
        } else {
            alert("Login failed: No token received.");
        }
    } catch (error) {
        alert("Login failed: " + (error.response?.data || error.message));
    }
};



const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
        if (!validUsername || !validEmail || !validPwd || !validMatch) {
            alert("Please fill all fields correctly.");
            return;
        }

        const response = await api.post("api/Auth/register", {
            email: email,
            username: username,
            password: pwd
        });

        alert("Registration successful: " + (response.data?.message || response.data));
        toggleForms();
    } catch (error) {
        alert("Registration failed: " + (error.response?.data || error.message));
    }
};




const toggleForms = () => {
  const signInForm = document.getElementById('signIn');
  const signUpForm = document.getElementById('signUp');
  if (signInForm.style.display === 'block') {
    signInForm.style.display = 'none';
    signUpForm.style.display = 'block';
  } else {
    signInForm.style.display = 'block';
    signUpForm.style.display = 'none';
  }
};



//body -> login and register forms
return (
  <div id="login-comp">
    <NavbarLogin />

    <p ref={errRef} className={errorMessage ? 'errmsg' : "offscreen"} aria-live="assertive">{errorMessage}</p>

    <div className="container my-5" id="authForm">
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
          <p className="or">
            ---------or---------
          </p>
          <div className="links text-center">
            <p>Don't have an account yet?</p>
            <button type="button" className="btn valtas" onClick={toggleForms}>Register</button>
          </div>
          <p className="mt-5 mb-3 text-center">© 2024–2026</p>
        </form>
      </div>
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
              value={username}
              onChange={e => setUsername(e.target.value)}
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
              value={email}
              onChange={e => setEmail(e.target.value)}
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
            disabled={!validUsername || !validPwd || !validMatch}
          />
          <p className="or">
            ----------or--------
          </p>
          <div className="links text-center">
            <p>Already have an account?</p>
            <button type="button" className="btn valtas" onClick={toggleForms}>Log In</button>
          </div>
          <p className="mt-5 mb-3 text-center">© 2024–2026</p>
        </form>
      </div>
    </div>
    <Footer />
  </div>
);
}

export default Login;
