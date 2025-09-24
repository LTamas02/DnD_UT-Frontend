import { Route, Routes, Navigate, BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LogReg from "./pages/LogReg";
import Characters from "./pages/Characters";
import Dmtools from "./pages/Dmtools";
import Wiki from "./pages/Wiki";
import {Navbar} from "./components/Navbar";
import Character from "./pages/Character";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token); // If a token exists, set as authenticated

    // Example: Fetch user details (replace with actual API call)
    if (token) {
      setUsername(localStorage.getItem("username") || "Guest");
      setProfilePicture(localStorage.getItem("profilePicture") || "/defaults/profile_picture.jpg");
    }
  }, []);

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar isLoggedIn={isAuthenticated} username={username} profilePicture={profilePicture} />}
      
      <Routes>
        <Route path="/logreg" element={<LogReg />} />        
        {/* <Route path="/" element={isAuthenticated ? <Home/> : <Navigate to="/login" />} /> */}
        <Route path="/" element={<Home />} /> 
        {/* <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/logreg" />} /> */}
        <Route path="/profile" element={<Profile />} />
        {/* <Route path="/characters" element={isAuthenticated ? <Characters /> : <Navigate to="/logreg" />} /> */}
         <Route path="/characters" element={ <Characters />  }/>
        <Route path="/dmtools" element={isAuthenticated ? <Dmtools /> : <Navigate to="/logreg" />} />
        <Route path="/wiki" element={isAuthenticated ? <Wiki /> : <Navigate to="/logreg" />} />
        <Route path="/character/:id" element={<Character/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
