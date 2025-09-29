import { Route, Routes, Navigate, BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./Api"; // ✅ import api
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LogReg from "./pages/LogReg";
import Characters from "./pages/Characters";
import Dmtools from "./pages/Dmtools";
import Wiki from "./pages/Wiki";
import { Navbar } from "./components/Navbar";
import Character from "./pages/Character";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // Optional: load user info from API
      api
        .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          setUsername(res.data.username || "Guest");
          setProfilePicture(res.data.profilePicture || "/defaults/profile_picture.jpg");
          localStorage.setItem("username", res.data.username || "Guest");
          localStorage.setItem("profilePicture", res.data.profilePicture || "/defaults/profile_picture.jpg");
        })
        .catch(() => {
          setIsAuthenticated(false);
          localStorage.removeItem("token");
        });
    }
  }, []); // runs only once on mount

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <Navbar isLoggedIn={isAuthenticated} username={username} profilePicture={profilePicture} />
      )}
      <Routes>
        <Route path="/logreg" element={<LogReg setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/logreg" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/logreg" />} />
        <Route path="/characters" element={isAuthenticated ? <Characters /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools" element={isAuthenticated ? <Dmtools /> : <Navigate to="/logreg" />} />
        <Route path="/wiki" element={isAuthenticated ? <Wiki /> : <Navigate to="/logreg" />} />
        <Route path="/character/:id" element={<Character />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
