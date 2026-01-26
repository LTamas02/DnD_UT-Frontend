import "bootstrap/dist/css/bootstrap.css";
import "../assets/styles/Login.css";
import React, { useState, useEffect, useRef } from "react";
import { sha256 } from "js-sha256";
import { register, login, getSalt, saltSend } from "../assets/api/dndtoolapi";
import Footer from "../components/Footer";
import { NavbarLogin } from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_.]{2,19}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// 8–64 chars, at least: lowercase, uppercase, number, special
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

const passwordRules = {
  length: (s) => s.length >= 8 && s.length <= 64,
  lower: (s) => /[a-z]/.test(s),
  upper: (s) => /[A-Z]/.test(s),
  number: (s) => /\d/.test(s),
  special: (s) => /[^A-Za-z0-9]/.test(s),
};

const LogReg = ({ setIsAuthenticated }) => {
  const [errorMessage, setErrorMessage] = useState("");

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register states
  const [registerUsername, setRegisterUsername] = useState("");
  const [validUsername, setValidUsername] = useState(false);

  const [registerEmail, setRegisterEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);

  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);

  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const userRef = useRef(null);
  const errRef = useRef(null);
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

  // Password checks + strength + validity (single source of truth)
  useEffect(() => {
    const checks = {
      length: passwordRules.length(pwd),
      lower: passwordRules.lower(pwd),
      upper: passwordRules.upper(pwd),
      number: passwordRules.number(pwd),
      special: passwordRules.special(pwd),
    };
    setPasswordChecks(checks);

    const passed = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(passed);

    // validPwd aligns with regex and checks
    setValidPwd(passwordRegex.test(pwd));
    setValidMatch(pwd === matchPwd && pwd.length > 0);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrorMessage("");
  }, [email, password, registerUsername, registerEmail, pwd, matchPwd]);

  const strengthLabel = () => {
    if (passwordStrength <= 2) return { text: "Weak", class: "text-danger" };
    if (passwordStrength === 3) return { text: "Medium", class: "text-warning" };
    return { text: "Strong", class: "text-success" };
  };

  // ==============================
  // SALT + SHA256(password + salt)
  // ==============================
  function computeClientHash(plainPassword, salt) {
    return sha256(plainPassword + salt);
  }

  function generateSalt() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  // ==============================
  // LOGIN
  // ==============================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      errRef.current?.focus?.();
      return;
    }

    try {
      const saltResponse = await getSalt(email);
      const salt = saltResponse?.data?.salt;

      if (!salt) {
        setErrorMessage("Salt not found for this user.");
        errRef.current?.focus?.();
        return;
      }

      const clientHash = computeClientHash(password, salt);

      const response = await login(email, clientHash);
      const token = response?.data?.token;

      if (!token) {
        setErrorMessage("Login failed: No token received.");
        errRef.current?.focus?.();
        return;
      }

      localStorage.setItem("token", token);
      setIsAuthenticated(true);

      setEmail("");
      setPassword("");

      navigate("/");
    } catch (error) {
      const msg = error?.response?.data || error?.message || "Unknown error";
      setErrorMessage("Login failed: " + msg);
      errRef.current?.focus?.();
    }
  };

  // ==============================
  // REGISTER
  // ==============================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!validUsername || !validEmail || !validPwd || !validMatch) {
      setErrorMessage("Please complete all fields correctly.");
      errRef.current?.focus?.();
      return;
    }

    try {
      const salt = generateSalt();
      const clientHash = computeClientHash(pwd, salt);

      // Assuming register(email, username, passwordHash)
      await register(registerEmail, registerUsername, clientHash);

      // Assuming saltSend(email, salt)
      await saltSend(registerEmail, salt);

      setRegisterUsername("");
      setRegisterEmail("");
      setPwd("");
      setMatchPwd("");

      alert("Registration successful! Please log in.");
      toggleForms();
    } catch (error) {
      const msg = error?.response?.data || error?.message || "Unknown error";
      setErrorMessage("Registration failed: " + msg);
      errRef.current?.focus?.();
    }
  };

  const toggleForms = () => {
    const signInForm = document.getElementById("signIn");
    const signUpForm = document.getElementById("signUp");
    if (!signInForm || !signUpForm) return;

    if (signInForm.style.display === "block") {
      signInForm.style.display = "none";
      signUpForm.style.display = "block";
    } else {
      signUpForm.style.display = "none";
      signInForm.style.display = "block";
    }
    setErrorMessage("");
  };

  const strength = strengthLabel();

  return (
    <div id="login-comp">
      <NavbarLogin />

      <p
        ref={errRef}
        className={errorMessage ? "errmsg" : "offscreen"}
        aria-live="assertive"
      >
        {errorMessage}
      </p>

      <div className="container my-5" id="authForm">
        {/* LOGIN FORM */}
        <div id="signIn" style={{ display: "block" }}>
          <h1 className="form-title mb-4">Sign In</h1>

          <form onSubmit={handleLoginSubmit}>
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                required
                ref={userRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <input
              type="submit"
              className="btn btn-success w-100"
              value="Sign In"
            />

            <p className="or">---------or---------</p>

            <div className="links text-center">
              <p>Don't have an account yet?</p>
              <button type="button" className="btn valtas" onClick={toggleForms}>
                Register
              </button>
            </div>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div id="signUp" style={{ display: "none" }}>
          <h1 className="form-title mb-4">Sign Up</h1>

          <form onSubmit={handleRegisterSubmit}>
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Username"
                required
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
              />
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                required
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />

              {pwd && (
                <div className="mt-2 small w-100">
                  <div className={passwordChecks.length ? "text-success" : "text-danger"}>
                    • 8–64 characters
                  </div>
                  <div className={passwordChecks.lower ? "text-success" : "text-danger"}>
                    • Lowercase letter
                  </div>
                  <div className={passwordChecks.upper ? "text-success" : "text-danger"}>
                    • Uppercase letter
                  </div>
                  <div className={passwordChecks.number ? "text-success" : "text-danger"}>
                    • Number
                  </div>
                  <div className={passwordChecks.special ? "text-success" : "text-danger"}>
                    • Special character
                  </div>

                  <div className={`mt-1 fw-bold ${strength.class}`}>
                    Password strength: {strength.text}
                  </div>
                </div>
              )}
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm Password"
                required
                value={matchPwd}
                onChange={(e) => setMatchPwd(e.target.value)}
              />
            </div>

            <input
              type="submit"
              className="btn btn-success w-100"
              value="Sign Up"
              disabled={!validUsername || !validEmail || !validPwd || !validMatch}
            />

            <p className="or">---------or---------</p>

            <div className="links text-center">
              <p>Already have an account?</p>
              <button type="button" className="btn valtas" onClick={toggleForms}>
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LogReg;

