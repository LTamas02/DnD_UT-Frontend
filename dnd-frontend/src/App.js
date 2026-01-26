import { Route, Routes, Navigate, BrowserRouter, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, getProfileTheme, completeTutorial } from "./assets/api/dndtoolapi";
import { DEFAULT_THEME, THEME_KEY, applyTheme } from "./theme";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import LogReg from "./pages/LogReg";
import Characters from "./pages/Characters";
import Dmtools from "./pages/dmtoolPages/Dmtools";
import DmtoolsEncounters from "./pages/dmtoolPages/DmtoolsEncounters";
import DmtoolsLoot from "./pages/dmtoolPages/DmtoolsLoot";
import DmtoolsMaps from "./pages/dmtoolPages/DmtoolsMaps";
import Wiki from "./pages/Wiki";
import Friends from "./pages/Friends";
import BooksLibrary from "./pages/BooksLibrary";
import BooksRules from "./pages/BooksRules";
import { Navbar, NavbarProfile } from "./components/Navbar";
import Character from "./pages/Character";
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
import DmtoolsNpcs from "./pages/dmtoolPages/DmtoolsNpcs";
import VttLobby from "./pages/dmtoolPages/VttLobby";
import VttSession from "./pages/dmtoolPages/VttSession";
import TutorialOverlay from "./components/TutorialOverlay";

import AbilityScoresWiki from "./pages/wikiPages/AbilityScores";
import Alignment from "./pages/wikiPages/Alignments";
import Conditions from "./pages/wikiPages/Conditions";
import DamageTypes from "./pages/wikiPages/DamageTypes";
import Languages from "./pages/wikiPages/Languages";
import Language from "./pages/wikiPages/Language";
import LoadingOverlay from "./components/LoadingOverlay";
import { getLoadingCount, subscribeLoading } from "./loadingStore";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(true); // <-- Add loading state
  const [globalLoading, setGlobalLoading] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true);
  const rawToken = localStorage.getItem("token");
  const token = rawToken && rawToken !== "undefined" && rawToken !== "null" ? rawToken : null;

  useEffect(() => {
    if (rawToken === "undefined" || rawToken === "null") {
      localStorage.removeItem("token");
    }
  }, [rawToken]);

  useEffect(() => {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) {
      applyTheme(DEFAULT_THEME);
      return;
    }
    try {
      const saved = JSON.parse(raw);
      applyTheme({ ...DEFAULT_THEME, ...saved });
    } catch {
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  useEffect(() => {
    if (token) {
      getUser(token)
        .then(res => {
          setIsAuthenticated(true);
          setUsername(res.data.username || "Guest");
          const nextProfilePicture =
            res.data.profilePictureUrl ||
            res.data.profilePicture ||
            "/defaults/profile_picture.jpg";
          setProfilePicture(nextProfilePicture);
          localStorage.setItem("profilePicture", nextProfilePicture);
          localStorage.setItem("username", res.data.username || "Guest");
          if (res.data.id != null) {
            localStorage.setItem("userId", res.data.id);
          }
          setHasCompletedTutorial(res.data.hasCompletedTutorial ?? true);

          getProfileTheme(token)
            .then(themeRes => {
              if (themeRes.data?.theme) {
                const merged = { ...DEFAULT_THEME, ...themeRes.data.theme };
                localStorage.setItem(THEME_KEY, JSON.stringify(merged));
                applyTheme(merged);
              }
            })
            .catch(() => {
              // ignore theme fetch errors
            });
        })
        .catch(() => {
          setIsAuthenticated(false);
          setHasCompletedTutorial(true);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false)); // <-- Set loading to false after check
    } else {
      setLoading(false); // <-- No token, done loading
    }
  }, [token]);

  useEffect(() => {
    const update = (count) => setGlobalLoading(count > 0);
    update(getLoadingCount());
    return subscribeLoading(update);
  }, []);

  if (loading) {
    return <LoadingOverlay active label="Loading profile..." />;
  }

  return (
    <BrowserRouter>
      <AppWithRouter
        isAuthenticated={isAuthenticated}
        username={username}
        profilePicture={profilePicture}
        setIsAuthenticated={setIsAuthenticated}
        setUsername={setUsername}
        setProfilePicture={setProfilePicture}
        hasCompletedTutorial={hasCompletedTutorial}
        onTutorialComplete={() => {
          setHasCompletedTutorial(true);
          if (token) {
            completeTutorial(token).catch(() => {});
          }
        }}
        onTutorialStart={() => window.dispatchEvent(new CustomEvent("tutorial:start"))}
      />
      <LoadingOverlay active={globalLoading} />
    </BrowserRouter>
  );
}

function AppWithRouter({
  isAuthenticated,
  username,
  profilePicture,
  setIsAuthenticated,
  setUsername,
  setProfilePicture,
  hasCompletedTutorial,
  onTutorialComplete,
  onTutorialStart
}) {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/profile" ? (
        <NavbarProfile username={username} profilePicture={profilePicture} />
      ) : location.pathname !== "/logreg" ? ( // only render navbars if NOT logreg
        <Navbar username={username} profilePicture={profilePicture} />
      ) : null}

      <TutorialOverlay
        isAuthenticated={isAuthenticated}
        username={username}
        hasCompletedTutorial={hasCompletedTutorial}
        onComplete={onTutorialComplete}
      />

      <Routes>
        <Route path="/logreg" element={<LogReg setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/logreg" />} />
        <Route path="*" element={isAuthenticated ? <Home /> : <Navigate to="/logreg" />} />
        <Route
          path="/profile"
          element={
            isAuthenticated ? <Profile onStartTutorial={onTutorialStart} /> : <Navigate to="/logreg" />
          }
        />
        <Route path="/friends" element={isAuthenticated ? <Friends /> : <Navigate to="/logreg" />} />
        <Route path="/characters" element={isAuthenticated ? <Characters /> : <Navigate to="/logreg" />} />
        <Route path="/character/:id" element={isAuthenticated ? <Character /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools" element={isAuthenticated ? <Dmtools /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/encounters" element={isAuthenticated ? <DmtoolsEncounters /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/npcs" element={isAuthenticated ? <DmtoolsNpcs /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/loot" element={isAuthenticated ? <DmtoolsLoot /> : <Navigate to="/logreg" />} />
        <Route path="/dmtools/maps" element={isAuthenticated ? <DmtoolsMaps /> : <Navigate to="/logreg" />} />
        <Route path="/vtt" element={isAuthenticated ? <VttLobby /> : <Navigate to="/logreg" />} />
        <Route path="/vtt/:sessionId" element={isAuthenticated ? <VttSession /> : <Navigate to="/logreg" />} />
        <Route path="/wiki" element={isAuthenticated ? <Wiki /> : <Navigate to="/logreg" />} />
        <Route path="/books" element={isAuthenticated ? <BooksLibrary /> : <Navigate to="/logreg" />} />
        <Route path="/books/rules" element={isAuthenticated ? <BooksRules /> : <Navigate to="/logreg" />} />
        <Route path="/books/rules/:fileName" element={isAuthenticated ? <BooksRules /> : <Navigate to="/logreg" />} />


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
