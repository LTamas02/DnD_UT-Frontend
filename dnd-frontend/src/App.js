import { Route, Routes, Navigate, BrowserRouter, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser } from "./Api";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LogReg from "./pages/LogReg";
import Characters from "./pages/Characters";
import Dmtools from "./pages/Dmtools";
import DmtoolsEncounters from "./pages/DmtoolsEncounters";
import DmtoolsLoot from "./pages/DmtoolsLoot";
import DmtoolsMaps from "./pages/DmtoolsMaps";
import Wiki from "./pages/Wiki";
import Friends from "./pages/Friends";
import { Navbar, NavbarLogin, NavbarProfile } from "./components/Navbar";
import Character from "./pages/Character";
import Community from "./pages/Community";
import Spells from "./pages/wikiPages/Spells";
import Spell from "./pages/wikiPages/Spell";
import Classes from "./pages/wikiPages/Classes";
import Class from "./pages/wikiPages/Class";
import Races from './pages/wikiPages/Races'
import Race from "./pages/wikiPages/Race";
import Monsters from './pages/wikiPages/Monsters'
import Monster from "./pages/wikiPages/Monster";
import Equipments from './pages/wikiPages/Equipments'
import Backgrounds from './pages/wikiPages/Backgrounds'
import Background from './pages/wikiPages/Background'
import DmtoolsDmScreen from "./pages/DmtoolsDmScreen";

import AbilityScoresWiki from "./pages/wikiPages/AbilityScores";
import Alignment from "./pages/wikiPages/Alignments";
import Conditions from "./pages/wikiPages/Conditions";
import DamageTypes from "./pages/wikiPages/DamageTypes";
import Languages from "./pages/wikiPages/Languages";
import Language from "./pages/wikiPages/Language";

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
      <AppWithRouter
        isAuthenticated={isAuthenticated}
        username={username}
        profilePicture={profilePicture}
        setIsAuthenticated={setIsAuthenticated}
        setUsername={setUsername}
        setProfilePicture={setProfilePicture}
      />
    </BrowserRouter>
  );
}

function AppWithRouter({
  isAuthenticated,
  username,
  profilePicture,
  setIsAuthenticated,
  setUsername,
  setProfilePicture
}) {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/profile" ? (
        <NavbarProfile username={username} profilePicture={profilePicture} />
      ) : location.pathname !== "/logreg" ? ( // only render navbars if NOT logreg
        <Navbar username={username} profilePicture={profilePicture} />
      ) : null}

      <Routes>
        <Route path="/logreg" element={<LogReg setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setProfilePicture={setProfilePicture} />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/logreg" />} />
        <Route path="*" element={isAuthenticated ? <Home /> : <Navigate to="/logreg" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/logreg" />} />
        <Route path="/friends" element={isAuthenticated ? <Friends /> : <Navigate to="/logreg" />} />
        <Route path="/characters" element={isAuthenticated ? <Characters /> : <Navigate to="/logreg" />} />
        <Route path="/character/:id" element={isAuthenticated ? <Character /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools" element={isAuthenticated ? <Dmtools /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/encounters" element={isAuthenticated ? <DmtoolsEncounters /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/dmscreen" element={isAuthenticated ? <DmtoolsDmScreen /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/loot" element={isAuthenticated ? <DmtoolsLoot /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/maps" element={isAuthenticated ? <DmtoolsMaps /> : <Navigate to="/logreg" />} />
        <Route path="/wiki" element={isAuthenticated ? <Wiki /> : <Navigate to="/logreg" />} />

        <Route path="/community" element={isAuthenticated ? <Community /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/spells" element={isAuthenticated ? <Spells /> : <Navigate to="/logreg" />} />
        <Route path="/spell/:index" element={isAuthenticated ? <Spell /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/classes" element={isAuthenticated ? <Classes /> : <Navigate to="/logreg" />} />
        <Route path="/class/:index" element={isAuthenticated ? <Class /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/races" element={isAuthenticated ? <Races /> : <Navigate to="/logreg" />} />
        <Route path="/race/:index" element={isAuthenticated ? <Race /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/monsters" element={isAuthenticated ? <Monsters /> : <Navigate to="/logreg" />} />
        <Route path="/monster/:index" element={isAuthenticated ? <Monster /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/backgrounds" element={isAuthenticated ? <Backgrounds /> : <Navigate to="/logreg" />} />
        <Route path="/background/:index" element={isAuthenticated ? <Background /> : <Navigate to="/logreg" />} />


        <Route path="/wiki/equipments" element={isAuthenticated ? <Equipments /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/ability-scores" element={isAuthenticated ? <AbilityScoresWiki /> : <Navigate to="/logreg" />} />
        <Route path="/wiki/alignments" element={isAuthenticated ? <Alignment /> : <Navigate to="/logreg" />} />
        <Route path="/wiki/conditions" element={isAuthenticated ? <Conditions /> : <Navigate to="/logreg" />} />
        <Route path="/wiki/damage-types" element={isAuthenticated ? <DamageTypes /> : <Navigate to="/logreg" />} />

        <Route path="/wiki/languages" element={isAuthenticated ? <Languages /> : <Navigate to="/logreg" />} />
        <Route path="/language/:index" element={isAuthenticated ? <Language /> : <Navigate to="/logreg" />} />


      </Routes>
    </>
  );
}

export default App;
