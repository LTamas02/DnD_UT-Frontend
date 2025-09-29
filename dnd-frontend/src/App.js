import { Route, Routes, Navigate, BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser } from "./Api";
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
  const [loading, setLoading] = useState(true); // <-- Add loading state
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      getUser(token)
        .then(res => {
          setIsAuthenticated(true);
          setUsername(res.data.username || "Guest");
          setProfilePicture(res.data.profilePicture || "/defaults/profile_picture.jpg");
          localStorage.setItem("profilePicture", res.data.profilePicture || "/defaults/profile_picture.jpg");
          localStorage.setItem("username", res.data.username || "Guest"); 
          alert("Welcome back, " + (res.data.username || "Guest") + "!");       
        })
        .catch(() => {
          setIsAuthenticated(false);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false)); // <-- Set loading to false after check
    } else {
      setLoading(false); // <-- No token, done loading
    }
  }, []);

  if (loading) return null; // or a loading spinner

  return (
    <BrowserRouter>
      {window.location.pathname !== "/logreg" && (
        window.location.pathname === "/profile"
          ? <Navbar username={username} profilePicture={profilePicture} profile />
          : <Navbar username={username} profilePicture={profilePicture} />
      )}
      <Routes>
        <Route path="/logreg" element={<LogReg setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setProfilePicture={setProfilePicture} />} />
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
