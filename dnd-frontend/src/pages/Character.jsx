import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import "../assets/styles/Character.css";
import {
  getAllSpells,
  getAllClasses,
  getClassByIndex,
  getWeapons,
  getAllRaces,
  getRaceByIndex
} from "../assets/api/wikiapi";
import { CharacterApi } from "../assets/api/dndtoolapi";

// ==========================================================
// === DEFAULT PROFILE & Helper Data ===
// ==========================================================

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const SKILL_MAP = {
  acrobatics: "dex", animalHandling: "wis", arcana: "int", athletics: "str",
  deception: "cha", history: "int", insight: "wis", intimidation: "cha",
  investigation: "int", medicine: "wis", nature: "int", perception: "wis",
  performance: "cha", persuasion: "cha", religion: "int", sleightOfHand: "dex",
  stealth: "dex", survival: "wis"
};
const SKILL_KEYS = Object.keys(SKILL_MAP);

const THEME_OPTIONS = [
  { key: "parchment", label: "Parchment", description: "Classic parchment scroll with gilded highlights." },
  { key: "shadowfell", label: "Shadowfell", description: "Violet mist, ghostly particles, and rune glows." },
  { key: "elven", label: "Elven", description: "Verdant nebula with graceful leaf-like filigree." }
];

const buildSkillFlagMap = (source, prefix) => {
  const flags = {};
  SKILL_KEYS.forEach((skill) => {
    const field = `${prefix}_${skill}`;
    flags[skill] = !!source?.[field];
  });
  return flags;
};

const DEFAULT_PROFILE = {
  id: null, 
  characterName: "", race: "", raceIndex: "", classIndex: "", classLevel: 1, background: "",
  playerName: "", alignment: "", xp: 0, inspiration: false,
  profBonus: 2, 
  
  age: "", height: "", weight: "", eyes: "", skin: "", hair: "",
  symbol: "", appearance: "",

  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  saveProf: {}, 
  skillProf: {}, 
  skillExpertise: {},
  passivePerception: 10,

  armor: 10, initiative: 0, speed: 30,
  hpMax: 0, hpCurrent: 0, hpTemp: 0,
  deathSuccesses: 0, deathFailures: 0,
  
  attacks: [], 
  
  generalEquipment: [], 
  equipment: "", 
  cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
  
  personalityTraits: "", ideals: "", bonds: "", flaws: "",
  allies: "", additionalFeatures: "", treasure: "", backstory: "",
  
  slots1Total: 0, slots1Used: 0, slots2Total: 0, slots2Used: 0, slots3Total: 0, slots3Used: 0,
  slots4Total: 0, slots4Used: 0, slots5Total: 0, slots5Used: 0, slots6Total: 0, slots6Used: 0,
  slots7Total: 0, slots7Used: 0, slots8Total: 0, slots8Used: 0, slots9Total: 0, slots9Used: 0,
  
  selectedSpells: [], 
  portraitDataUrl: ""
};
const parseJsonList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const mapFromApi = (charData) => ({
  ...DEFAULT_PROFILE,
  ...charData,
  id: charData.id ?? null,
  inspiration: !!charData.inspiration,
  int: charData.int_stat ?? charData.int ?? DEFAULT_PROFILE.int,
  saveProf: {
    str: !!charData.saveProf_str,
    dex: !!charData.saveProf_dex,
    con: !!charData.saveProf_con,
    int: !!charData.saveProf_int,
    wis: !!charData.saveProf_wis,
    cha: !!charData.saveProf_cha
  },
  skillExpertise: buildSkillFlagMap(charData, "skillExp"),
  skillProf: SKILL_KEYS.reduce((acc, skill) => {
    const hasExpertise = !!charData[`skillExp_${skill}`];
    return {
      ...acc,
      [skill]: hasExpertise || !!charData[`skillProf_${skill}`]
    };
  }, {}),
  attacks: parseJsonList(charData.attacks),
  selectedSpells: parseJsonList(charData.spellbook),
  generalEquipment: parseJsonList(charData.featuresFeats)
});

const toInt = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const safeJsonArrayString = (value) => {
  if (value === null || value === undefined || value === "") {
    return "[]";
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === "object") {
    return JSON.stringify([value]);
  }

  if (typeof value !== "string") {
    return "[]";
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed);
    }
  } catch {
    return "[]";
  }

  return "[]";
};

const buildSavePayload = (profile) => ({
  id: profile.id ?? 0,
  characterName: safeString(profile.characterName),
  classLevel: safeString(profile.classLevel),
  race: safeString(profile.race),
  background: safeString(profile.background),
  playerName: safeString(profile.playerName),
  alignment: safeString(profile.alignment),
  xp: toInt(profile.xp),
  inspiration: profile.inspiration ? 1 : 0,
  age: toInt(profile.age),
  height: safeString(profile.height),
  weight: safeString(profile.weight),
  eyes: safeString(profile.eyes),
  skin: safeString(profile.skin),
  hair: safeString(profile.hair),
  symbol: safeString(profile.symbol),
  appearance: safeString(profile.appearance),
  str: toInt(profile.str),
  dex: toInt(profile.dex),
  con: toInt(profile.con),
  int_stat: toInt(profile.int),
  wis: toInt(profile.wis),
  cha: toInt(profile.cha),
  profBonus: toInt(profile.profBonus),
  profBonusDuplicate: toInt(profile.profBonusDuplicate),
  saveProf_str: !!profile.saveProf?.str,
  saveProf_dex: !!profile.saveProf?.dex,
  saveProf_con: !!profile.saveProf?.con,
  saveProf_int: !!profile.saveProf?.int,
  saveProf_wis: !!profile.saveProf?.wis,
  saveProf_cha: !!profile.saveProf?.cha,
  skillProf_acrobatics: !!profile.skillProf?.acrobatics,
  skillProf_animalHandling: !!profile.skillProf?.animalHandling,
  skillProf_arcana: !!profile.skillProf?.arcana,
  skillProf_athletics: !!profile.skillProf?.athletics,
  skillProf_deception: !!profile.skillProf?.deception,
  skillProf_history: !!profile.skillProf?.history,
  skillProf_insight: !!profile.skillProf?.insight,
  skillProf_intimidation: !!profile.skillProf?.intimidation,
  skillProf_investigation: !!profile.skillProf?.investigation,
  skillProf_medicine: !!profile.skillProf?.medicine,
  skillProf_nature: !!profile.skillProf?.nature,
  skillProf_perception: !!profile.skillProf?.perception,
  skillProf_performance: !!profile.skillProf?.performance,
  skillProf_persuasion: !!profile.skillProf?.persuasion,
  skillProf_religion: !!profile.skillProf?.religion,
  skillProf_sleightOfHand: !!profile.skillProf?.sleightOfHand,
  skillProf_stealth: !!profile.skillProf?.stealth,
  skillProf_survival: !!profile.skillProf?.survival,
  skillExp_acrobatics: !!profile.skillExpertise?.acrobatics,
  skillExp_animalHandling: !!profile.skillExpertise?.animalHandling,
  skillExp_arcana: !!profile.skillExpertise?.arcana,
  skillExp_athletics: !!profile.skillExpertise?.athletics,
  skillExp_deception: !!profile.skillExpertise?.deception,
  skillExp_history: !!profile.skillExpertise?.history,
  skillExp_insight: !!profile.skillExpertise?.insight,
  skillExp_intimidation: !!profile.skillExpertise?.intimidation,
  skillExp_investigation: !!profile.skillExpertise?.investigation,
  skillExp_medicine: !!profile.skillExpertise?.medicine,
  skillExp_nature: !!profile.skillExpertise?.nature,
  skillExp_perception: !!profile.skillExpertise?.perception,
  skillExp_performance: !!profile.skillExpertise?.performance,
  skillExp_persuasion: !!profile.skillExpertise?.persuasion,
  skillExp_religion: !!profile.skillExpertise?.religion,
  skillExp_sleightOfHand: !!profile.skillExpertise?.sleightOfHand,
  skillExp_stealth: !!profile.skillExpertise?.stealth,
  skillExp_survival: !!profile.skillExpertise?.survival,
  armor: toInt(profile.armor),
  initiative: toInt(profile.initiative),
  speed: toInt(profile.speed),
  hpMax: toInt(profile.hpMax),
  hpCurrent: toInt(profile.hpCurrent),
  hpTemp: toInt(profile.hpTemp),
  hitDiceTotal: toInt(profile.hitDiceTotal),
  hitDiceCurrent: toInt(profile.hitDiceCurrent),
  deathSuccesses: toInt(profile.deathSuccesses),
  deathFailures: toInt(profile.deathFailures),
  passivePerception: toInt(profile.passivePerception),
  cp: toInt(profile.cp),
  sp: toInt(profile.sp),
  ep: toInt(profile.ep),
  gp: toInt(profile.gp),
  pp: toInt(profile.pp),
  otherProfs: safeString(profile.otherProfs),
  personalityTraits: safeString(profile.personalityTraits),
  ideals: safeString(profile.ideals),
  bonds: safeString(profile.bonds),
  flaws: safeString(profile.flaws),
  allies: safeString(profile.allies),
  additionalFeatures: safeString(profile.additionalFeatures),
  treasure: safeString(profile.treasure),
  backstory: safeString(profile.backstory),
  portraitDataUrl: safeString(profile.portraitDataUrl),
  equipment: safeJsonArrayString(profile.equipment),
  attacks: JSON.stringify(profile.attacks || []),
  spellbook: JSON.stringify(profile.selectedSpells || []),
  featuresFeats: JSON.stringify(profile.generalEquipment || [])
});

function normalizeArrayResponse(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.results)) return res.data.results;
  if (Array.isArray(res.results)) return res.results;
  return [];
}

function getProfBonusFromLevel(level) {
  const l = Number(level) || 1;
  if (l >= 17) return 6;
  if (l >= 13) return 5;
  if (l >= 9) return 4;
  if (l >= 5) return 3;
  return 2;
}

export default function Character() {
  const { id } = useParams();
  const navigate = useNavigate(); 
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState("identity");
  const [themeVariant, setThemeVariant] = useState(() => {
    try {
      return window.localStorage?.getItem("characterTheme") || "parchment";
    } catch {
      return "parchment";
    }
  });
  const [allClasses, setAllClasses] = useState([]);
  const [allSpells, setAllSpells] = useState([]);
  const [allWeapons, setAllWeapons] = useState([]);
  const [allRaces, setAllRaces] = useState([]);
  const [isLoading, setIsLoading] = useState(!!id);
  
  const [spellSearchTerm, setSpellSearchTerm] = useState(""); 
  const [selectedSpellDetail, setSelectedSpellDetail] = useState(null); 

  // --- CALCULATION HELPERS ---
  const getMod = useCallback((val) => {
    const score = Number(val) || 10;
    return Math.floor((score - 10) / 2);
  }, []);

  const calcSaving = useCallback((key) => {
    const base = getMod(profile[key] || 10);
    const hasProf = !!(profile.saveProf && profile.saveProf[key]);
    const total = base + (hasProf ? profile.profBonus : 0);
    return (total >= 0 ? "+" : "") + total;
  }, [profile, getMod]);

  const formatSigned = (value) => (value >= 0 ? `+${value}` : `${value}`);

  const getSkillData = useCallback((skill) => {
    const ability = SKILL_MAP[skill];
    const base = getMod(profile[ability] || 10);
    const hasProf = !!(profile.skillProf && profile.skillProf[skill]);
    const hasExpertise = !!(profile.skillExpertise && profile.skillExpertise[skill]);
    const bonus = (hasProf ? profile.profBonus : 0) + (hasExpertise ? profile.profBonus : 0);
    const total = base + bonus;
    return {
      ability,
      base,
      hasProf,
      hasExpertise,
      total,
      bonus
    };
  }, [profile, getMod]);

  const capitalizeWords = s => s.charAt(0).toUpperCase() + s.slice(1);

  useEffect(() => {
    try {
      window.localStorage?.setItem("characterTheme", themeVariant);
    } catch {
      // ignore
    }
  }, [themeVariant]);


  // --- STATE MODIFIER ---
  const setField = (key, value) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProficiencyChange = (type, key, checked) => {
    setProfile(prev => {
      const nextState = {
        ...prev,
        [type]: {
          ...(prev[type] || {}),
          [key]: checked
        }
      };
      if (type === "skillProf" && !checked) {
        nextState.skillExpertise = {
          ...(prev.skillExpertise || {}),
          [key]: false
        };
      }
      return nextState;
    });
  };

  const handleSkillExpertiseChange = (skill, checked) => {
    setProfile(prev => ({
      ...prev,
      skillExpertise: {
        ...(prev.skillExpertise || {}),
        [skill]: checked
      },
      skillProf: {
        ...(prev.skillProf || {}),
        [skill]: checked || !!prev.skillProf?.[skill]
      }
    }));
  };

  // --- FUNCTION BUTTON HANDLERS ---
  
  
  
  /**
   * Karakter mentése és új karakter esetén átirányítás az ID-val ellátott oldalra.
   */
  const handleSave = async () => {
    // Ha új karaktert hozunk létre, az id 'new', a mentés után megkapjuk az igazi id-t
    const isNewCharacter = id === 'new';

    try {
        const payload = buildSavePayload(profile);
        const savedData = isNewCharacter
            ? await CharacterApi.create(payload)
            : await CharacterApi.update(profile.id, payload); 
        alert("Character successfully saved!");
        
        // Ha új karakter volt, átirányítunk az új, valós ID-val ellátott URL-re
        if (isNewCharacter && savedData.id) {
            navigate(`/character/${savedData.id}`);
        }
        
        // Frissítjük a profile state-et a valós ID-val, ha 'new' volt az előző ID
        setProfile(mapFromApi(savedData));
    } catch (error) {
        console.error("Save failed:", error);
        alert(`Error during save: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!profile.id || id === 'new') {
        alert("Character not saved yet, cannot delete.");
        return;
    }
    if (!window.confirm(`Are you sure you want to delete ${profile.characterName}?`)) return;
    
    try {
        await CharacterApi.remove(profile.id);
        alert("Character successfully deleted!");
        navigate('/characters'); 
    } catch (error) {
        console.error("Delete failed:", error);
        alert(`Error during delete: ${error.message}`);
    }
  };

  const handleNew = () => {
    navigate('/character/new'); 
  };
  
  // --- AUTOMATIC PROFICIENCY HANDLING ---

  // Class Proficiencies
  useEffect(() => {
    if (!profile.classIndex) return;
    
    getClassByIndex(profile.classIndex)
      .then(classData => {
        const newSaveProfs = classData.saving_throws ? 
            classData.saving_throws.reduce((acc, st) => ({ ...acc, [st.index]: true }), {}) : {};
        
        setProfile(prev => ({
          ...prev,
          saveProf: {
            ...prev.saveProf,
            ...newSaveProfs 
          }
        }));
      })
      .catch(err => console.error("Failed to fetch class details for proficiencies:", err));
    
  }, [profile.classIndex]);

  // Race Proficiencies
  useEffect(() => {
    if (!profile.raceIndex) return;
    
    getRaceByIndex(profile.raceIndex)
      .then(raceData => {
        const newSkillProfs = raceData.starting_proficiencies ?
            raceData.starting_proficiencies
                .filter(p => p.type === 'skill' && p.index) 
                .reduce((acc, p) => ({ ...acc, [p.index]: true }), {}) : {};
        
        setProfile(prev => ({
          ...prev,
          skillProf: {
            ...prev.skillProf,
            ...newSkillProfs
          },
          speed: raceData.speed || prev.speed
        }));
      })
      .catch(err => console.error("Failed to fetch race details for proficiencies/speed:", err));

  }, [profile.raceIndex]);


  // --- FETCH D&D & CHARACTER DATA ---
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [classes, sres, wres, races] = await Promise.all([
          getAllClasses(),
          getAllSpells(),
          getWeapons(),
          getAllRaces(),
        ]);
        
        if (mounted) {
          setAllClasses(normalizeArrayResponse(classes));
          setAllSpells(normalizeArrayResponse(sres));
          setAllWeapons(normalizeArrayResponse(wres));
          setAllRaces(normalizeArrayResponse(races));
        }

        let charData = null;
        if (id && id !== 'new') { 
            charData = await CharacterApi.get(id);
        }

        if (mounted) {
          if (charData) {
            setProfile(mapFromApi(charData));
          } else if (id === 'new') {
            setProfile(DEFAULT_PROFILE);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        if(id && id !== 'new') {
             alert("Character loading failed!");
             navigate('/characters');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [id, navigate]);

  // --- DERIVED STATS UPDATE ---
  useEffect(() => {
    const rawPerceptionSkillValue = getMod(profile.wis) + (profile.skillProf?.perception ? profile.profBonus : 0);
    const newPassivePerception = 10 + rawPerceptionSkillValue;
    const newInitiative = getMod(profile.dex); // Csak a modifikátor
    const calculatedProfBonus = getProfBonusFromLevel(profile.classLevel);

    setProfile(prev => {
      let updated = false;
      let newProfile = { ...prev };

      if (newPassivePerception !== prev.passivePerception) {
        newProfile.passivePerception = newPassivePerception;
        updated = true;
      }
      if (newInitiative !== prev.initiative) {
        newProfile.initiative = newInitiative;
        updated = true;
      }
      if (prev.profBonus !== calculatedProfBonus) {
        newProfile.profBonus = calculatedProfBonus;
        updated = true;
      }

      return updated ? newProfile : prev;
    });
  }, [profile.dex, profile.wis, profile.skillProf.perception, profile.classLevel, profile.profBonus, getMod]);


  // --- ATTACK MANAGEMENT (FIXED: Damage Dice Access) ---
  const addNewAttack = (weaponData = null) => {
    const modKey = profile.dex > profile.str ? 'dex' : 'str'; 
    const attackMod = getMod(profile[modKey]) + profile.profBonus;

    // FIX: Safely access damage dice string, defaulting to "N/A" if missing
    const damageDice = weaponData?.damage?.damage_dice || "N/A";

    const newAttack = weaponData ? {
      name: weaponData.name,
      bonus: `+${attackMod}`,
      damage: `${damageDice}+${getMod(profile[modKey])}`, 
      type: weaponData.damage?.damage_type?.name || "Unspecified", 
      notes: weaponData.desc || ""
    } : { name: "", bonus: "", damage: "", type: "", notes: "" };

    setProfile(prev => ({
      ...prev,
      attacks: [
        ...(prev.attacks || []),
        newAttack
      ]
    }));
  };

  const handleWeaponSelection = (event) => {
    const selectedIndex = event.target.value;
    if (selectedIndex) {
      const weaponData = allWeapons.find(w => w.index === selectedIndex);
      if (weaponData) {
        addNewAttack(weaponData);
        event.target.value = ""; 
      }
    }
  };

  const updateAttackField = (index, key, value) => {
    setProfile(prev => {
      const newAttacks = [...(prev.attacks || [])];
      newAttacks[index] = { ...newAttacks[index], [key]: value };
      return { ...prev, attacks: newAttacks };
    });
  };

  const removeAttack = (index) => {
    setProfile(prev => ({
      ...prev,
      attacks: prev.attacks.filter((_, i) => i !== index)
    }));
  };
  
  // --- SPELL MANAGEMENT ---
  const filteredSpells = (allSpells || [])
    .filter(spell => 
        spell.name.toLowerCase().includes(spellSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const handleSpellSearchSelect = (event) => {
    const selectedIndex = event.target.value;
    if (selectedIndex) {
        const spellData = allSpells.find(s => s.index === selectedIndex);
        setSelectedSpellDetail(spellData);
        event.target.value = "";
        setSpellSearchTerm(""); 
    }
  };

  const addSpellToCharacter = (spell) => {
    const isSelected = profile.selectedSpells.some(s => s.index === spell.index);
    if (isSelected) {
        alert(`${spell.name} is already added!`);
        return;
    }

    const newSpell = {
        index: spell.index, 
        name: spell.name, 
        level: spell.level,
        casting_time: spell.casting_time,
        range: spell.range,
        duration: spell.duration,
        concentration: spell.concentration || false,
    };
    
    setProfile(prev => ({
        ...prev,
        selectedSpells: [...(prev.selectedSpells || []), newSpell]
    }));
    setSelectedSpellDetail(null);
  };
  
  const removeSpell = (index) => {
    setProfile(prev => ({
        ...prev,
        selectedSpells: prev.selectedSpells.filter(s => s.index !== index)
    }));
  };

  const addCustomSpell = () => {
      const customSpell = {
          index: `custom-${Date.now()}`,
          name: "New Custom Spell",
          level: 1,
          casting_time: "1 Action",
          range: "30 ft",
          duration: "Instantaneous",
          concentration: false,
          custom: true
      };
      setProfile(prev => ({
          ...prev,
          selectedSpells: [...(prev.selectedSpells || []), customSpell]
      }));
  };

  const updateCustomSpellField = (index, key, value) => {
      setProfile(prev => {
          const newSpells = [...(prev.selectedSpells || [])];
          const spellIndex = newSpells.findIndex(s => s.index === index);
          if (spellIndex > -1) {
              const val = (key === 'level') ? Number(value) : value; 
              newSpells[spellIndex] = { ...newSpells[spellIndex], [key]: val };
          }
          return { ...prev, selectedSpells: newSpells };
      });
  };


  // --- JSX START ---
  if (isLoading) {
    return <div className="loading-state">Loading Character...</div>;
  }

  const navTabs = ["identity", "stats", "combat", "equipment", "story"];

  return (
    <div className={`character-app character-theme theme-${themeVariant}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* A név automatikusan frissül, mivel a 'profile' state-hez van kötve */}
          <div className="sidebar-name">{profile.characterName || (id === 'new' ? "New Character" : "No Name")}</div>
          <div className="sidebar-class">
            {profile.classIndex ? `${capitalizeWords(profile.classIndex)} ${profile.classLevel}` : "Class & Level"}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="sidebar-nav">
          {navTabs.map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {capitalizeWords(tab)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="page-container">
        
        {/* --- ACTION BAR / FUNCTION BUTTONS --- */}
          <header className="action-bar card">
            <div>
              <h1>{profile.characterName || (id === 'new' ? "Create New Character" : "Edit Character")}</h1>
              <div className="theme-selector">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.key}
                    type="button"
                    className={`theme-option ${themeVariant === theme.key ? "active" : ""}`}
                    onClick={() => setThemeVariant(theme.key)}
                    title={theme.description}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn-save btn-aura" onClick={handleSave}>
                Save
              </button>
            <button 
                className="btn-delete btn-aura" 
                onClick={handleDelete}
                disabled={!profile.id || id === 'new'} 
            >
              Delete
            </button>
            <button className="btn-new btn-aura" onClick={handleNew}>
              New Character
            </button>
          </div>
        </header>


        {/* --- IDENTITY TAB (Redesigned) --- */}
        {activeTab === "identity" && (
          <section className="tab-page">
            <h2>Identity</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                
                {/* Left Column: Core Info & Appearance */}
                <div>
                    <section className="card">
                        <h2 className="section-title">Core Details (Race/Class selection sets base proficiencies)</h2>
                        <div className="grid-3">
                            <div><label>Name</label><input value={profile.characterName} onChange={e => setField("characterName", e.target.value)} className="input-dark" /></div>
                            <div><label>Race</label>
                            <select value={profile.raceIndex || ""} onChange={e => setField("raceIndex", e.target.value)} className="input-dark">
                                <option value="">Select Race</option>
                                {(allRaces || []).map(r => (<option key={r.index} value={r.index}>{r.name}</option>))}
                            </select>
                            </div>
                            <div><label>Class & Level</label>
                            <div style={{display: 'flex', gap: '5px'}}>
                                <select value={profile.classIndex || ""} onChange={e => setField("classIndex", e.target.value)} className="input-dark" style={{flexGrow: 1}}>
                                <option value="">Select Class</option>
                                {(allClasses || []).map(c => (<option key={c.index} value={c.index}>{c.name}</option>))}
                                </select>
                                <input type="number" min="1" max="20" value={profile.classLevel} onChange={e => setField("classLevel", Number(e.target.value))} className="input-dark" style={{width: '60px'}} />
                            </div>
                            </div>
                        </div>
                        <div className="grid-3 mt-2">
                            <div><label>Background</label><input value={profile.background} onChange={e => setField("background", e.target.value)} className="input-dark" /></div>
                            <div><label>Alignment</label><input value={profile.alignment} onChange={e => setField("alignment", e.target.value)} className="input-dark" /></div>
                            <div><label>XP</label><input type="number" value={profile.xp} onChange={e => setField("xp", Number(e.target.value))} className="input-dark" /></div>
                        </div>
                        <div className="prof-bonus-line mt-2" style={{borderTop: '1px solid var(--app-border, #444)', paddingTop: '10px'}}>
                            <span>Proficiency Bonus</span>
                            <input type="number" value={profile.profBonus} onChange={e => setField("profBonus", Number(e.target.value))} className="input-dark" style={{width: '60px', textAlign: 'center'}} />
                        </div>
                    </section>
                
                    <section className="card mt-4">
                        <h2 className="section-title">Appearance</h2>
                        <div className="grid-3">
                            <div><label>Age</label><input value={profile.age} onChange={e => setField("age", e.target.value)} className="input-dark" /></div>
                            <div><label>Height</label><input value={profile.height} onChange={e => setField("height", e.target.value)} className="input-dark" /></div>
                            <div><label>Weight</label><input value={profile.weight} onChange={e => setField("weight", e.target.value)} className="input-dark" /></div>
                            <div><label>Eyes</label><input value={profile.eyes} onChange={e => setField("eyes", e.target.value)} className="input-dark" /></div>
                            <div><label>Skin</label><input value={profile.skin} onChange={e => setField("skin", e.target.value)} className="input-dark" /></div>
                            <div><label>Hair</label><input value={profile.hair} onChange={e => setField("hair", e.target.value)} className="input-dark" /></div>
                        </div>
                        <div className="mt-2"><label>Symbol / Deity</label><input value={profile.symbol} onChange={e => setField("symbol", e.target.value)} className="input-dark" /></div>
                        <div className="mt-2"><label>Full Appearance</label><textarea value={profile.appearance} onChange={e => setField("appearance", e.target.value)} className="textarea-dark" /></div>
                    </section>
                </div>

                {/* Right Column: Player & Portrait */}
                <div>
                    <section className="card">
                        <h2 className="section-title">Player Info</h2>
                        <div className="grid-1">
                            <div><label>Player Name</label><input value={profile.playerName} onChange={e => setField("playerName", e.target.value)} className="input-dark" /></div>
                            <div className="mt-2"><label>Inspiration</label><input type="checkbox" checked={profile.inspiration} onChange={e => setField("inspiration", e.target.checked)} /></div>
                        </div>
                    </section>
                    
                    <section className="card mt-4">
                        <h2 className="section-title">Portrait</h2>
                        <input type="file" id="portraitUpload" accept="image/*" onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (e) => { setField("portraitDataUrl", e.target.result); };
                            reader.readAsDataURL(file);
                        }} />
                        {profile.portraitDataUrl && (
                            <img src={profile.portraitDataUrl} alt="Character Portrait Preview" style={{ maxWidth: '100%', marginTop: '10px', border: '2px solid var(--app-border, #6b4226)' }} />
                        )}
                    </section>
                </div>
            </div>
          </section>
        )}

        {/* --- STATS TAB --- */}
        {activeTab === "stats" && (
          <section className="tab-page">
            <h2>Abilities & Proficiencies</h2>
            
            <div className="grid-3" style={{gridTemplateColumns: '1fr 1fr 2fr', gap: '20px'}}>
                
                {/* Column 1: Ability Scores */}
                <section className="card">
                    <h2 className="section-title">Ability Scores</h2>
                    <div className="abilities-grid" style={{ display: 'grid', gap: '10px' }}>
                        {ABILITIES.map(ab => (
                        <div key={ab} className="ability">
                            <span className="ability-label">{ab.toUpperCase()}</span>
                            <input 
                            type="number" 
                            min="1"
                            value={profile[ab]} 
                            onChange={e => setField(ab, Number(e.target.value))} 
                            className="input-dark"
                            style={{ width: '60px', textAlign: 'center' }}
                            />
                            <span className="mod-pill">
                            {getMod(profile[ab] || 10) >= 0 ? "+" : ""}{getMod(profile[ab] || 10)}
                            </span>
                        </div>
                        ))}
                    </div>
                    <div className="passive-line mt-3" style={{borderTop: '1px solid var(--app-border, #6b4226)', paddingTop: '10px'}}>
                        <span>Passive Perception</span>
                        <input value={profile.passivePerception} readOnly className="input-dark" style={{ width: '60px', textAlign: 'center' }} />
                    </div>
                </section>
                
                {/* Column 2: Saving Throws */}
                <section className="card">
                    <h2 className="section-title">Saving Throws</h2>
                    <div className="saves-grid" style={{ display: 'grid', gap: '5px' }}>
                        {ABILITIES.map(ab => (
                        <div key={ab} className="save-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ margin: 0 }}>
                            <input 
                                type="checkbox" 
                                checked={!!profile.saveProf?.[ab]}
                                onChange={e => handleProficiencyChange("saveProf", ab, e.target.checked)}
                            /> 
                            {capitalizeWords(ab)}
                            </label>
                            <input value={calcSaving(ab)} readOnly className="computed input-dark" style={{ width: '40px', textAlign: 'center' }} />
                        </div>
                        ))}
                    </div>
                </section>

                {/* Column 3: Skills */}
                <section className="card">
                    <h2 className="section-title">Skills</h2>
                    <div className="skills-grid-wrapper">
                        <div className="skills-grid-header">
                            <span>Skill</span>
                            <span>Ability</span>
                            <span>Prof.</span>
                            <span>Expert.</span>
                            <span>Bonus</span>
                        </div>
                        <div className="skills-columns">
                            {(() => {
                                const half = Math.ceil(SKILL_KEYS.length / 2);
                                const left = SKILL_KEYS.slice(0, half);
                                const right = SKILL_KEYS.slice(half);

                                const renderColumn = (skills) => (
                                    <div className="skills-column">
                                        {skills.map((skill) => {
                                            const skillData = getSkillData(skill);
                                            return (
                                                <div key={skill} className="skill-row">
                                                    <div className="skill-name">
                                                        <strong>{capitalizeWords(skill)}</strong>
                                                        {skillData.ability && (
                                                            <span className="skill-ability-abbrev">{skillData.ability.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="skill-ability-score">
                                                        <span>{formatSigned(skillData.base)}</span>
                                                    </div>
                                                    <label className="skill-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={skillData.hasProf}
                                                            onChange={(e) => handleProficiencyChange("skillProf", skill, e.target.checked)}
                                                        />
                                                        <span>Prof</span>
                                                    </label>
                                                    <label className="skill-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={skillData.hasExpertise}
                                                            onChange={(e) => handleSkillExpertiseChange(skill, e.target.checked)}
                                                        />
                                                        <span>Exp</span>
                                                    </label>
                                                    <div className="skill-total">
                                                        <span>{formatSigned(skillData.total)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );

                                return (
                                    <>
                                        {renderColumn(left)}
                                        {renderColumn(right)}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </section>

            </div>
          </section>
        )}

        {/* --- COMBAT + SPELLS TAB --- */}
        {activeTab === "combat" && (
          <section className="tab-page">
            <h2>Combat & Spells</h2>
            
            {/* TOP ROW: Core Combat Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: '20px' }}>
                
                <section className="card">
                    <h2 className="section-title">AC, Init & Speed</h2>
                    <div className="grid-3">
                        <div><label>Armor Class</label><input type="number" value={profile.armor} onChange={e => setField("armor", Number(e.target.value))} className="input-dark" /></div>
                        {/* Javítva a mező elrendezése a CSS-ben */}
                        <div><label>Initiative</label><input value={(profile.initiative >= 0 ? "+" : "") + profile.initiative} readOnly className="input-dark" /></div>
                        <div><label>Speed (ft)</label><input type="number" value={profile.speed} onChange={e => setField("speed", Number(e.target.value))} className="input-dark" /></div>
                    </div>
                </section>

                <section className="card">
                    <h2 className="section-title">Hit Points</h2>
                    <div className="grid-3">
                        <div><label>HP Max</label><input type="number" value={profile.hpMax} onChange={e => setField("hpMax", Number(e.target.value))} className="input-dark" /></div>
                        {/* Javítva a mező elrendezése a CSS-ben */}
                        <div><label>Current HP</label><input type="number" value={profile.hpCurrent} onChange={e => setField("hpCurrent", Number(e.target.value))} className="input-dark" /></div>
                        <div><label>Temp HP</label><input type="number" value={profile.hpTemp} onChange={e => setField("hpTemp", Number(e.target.value))} className="input-dark" /></div>
                    </div>
                </section>

                <section className="card">
                    <h2 className="section-title">Death Saves</h2>
                    <div className="death-saves" style={{display: 'flex', justifyContent: 'space-around'}}>
                    <div>
                        <label>Successes</label>
                        {[1, 2, 3].map(i => (
                            <input 
                            key={`ds-${i}`} 
                            type="checkbox" 
                            checked={profile.deathSuccesses >= i}
                            onChange={() => setField("deathSuccesses", profile.deathSuccesses === i ? i - 1 : i)}
                            />
                        ))}
                    </div>
                    <div>
                        <label>Failures</label>
                        {[1, 2, 3].map(i => (
                            <input 
                            key={`df-${i}`} 
                            type="checkbox" 
                            checked={profile.deathFailures >= i}
                            onChange={() => setField("deathFailures", profile.deathFailures === i ? i - 1 : i)}
                            />
                        ))}
                    </div>
                    </div>
                </section>
            </div>
              
            {/* MIDDLE ROW: Attacks & Spell Slots */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* Attacks and Spellcasting */}
                <section className="card mt-4">
                    <h2 className="section-title">Attacks</h2>
                    
                    <div className="add-weapon-line">
                        <label>Add Weapon from API:</label>
                        <select onChange={handleWeaponSelection} defaultValue="" className="input-dark">
                            <option value="" disabled>Select a Weapon</option>
                            {allWeapons.map(w => (
                                <option key={w.index} value={w.index}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div id="attacksContainer" className="mt-2">
                        <div className="attack-header" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr 30px', fontWeight: 'bold', borderBottom: '1px solid var(--app-border, #6b4226)', paddingBottom: '5px' }}>
                            <span>Name</span>
                            <span>Bonus</span>
                            <span>Damage / Type</span>
                            <span></span>
                        </div>
                        {(profile.attacks || []).map((atk, index) => (
                            <div key={index} className="attack-row page-fade-item" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 3fr 30px', gap: '5px', padding: '5px 0' }}>
                            <input 
                                className="input-dark"
                                placeholder="Name"
                                value={atk.name || ""}
                                onChange={e => updateAttackField(index, "name", e.target.value)}
                            />
                            <input 
                                className="input-dark"
                                placeholder="Bonus"
                                value={atk.bonus || ""}
                                onChange={e => updateAttackField(index, "bonus", e.target.value)}
                                style={{textAlign: 'center'}}
                            />
                            <input 
                                className="input-dark"
                                placeholder="Damage / Type"
                                value={atk.damage || ""}
                                onChange={e => updateAttackField(index, "damage", e.target.value)}
                            />
                            <button className="btn-aura small" onClick={() => removeAttack(index)}>X</button>
                            </div>
                        ))}
                    </div>
                    <button id="addAttack" className="btn-aura mt-2" onClick={() => addNewAttack(null)}>
                        + Add Custom Attack
                    </button>
                </section>

                {/* Spell Slots (Compact) - FIXED to 1 column grid */}
                <section className="card mt-4">
                    <h2 className="section-title">Spell Slots (Compact)</h2>
                    <div className="spell-slots-compact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                        <div key={level} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                background: 'var(--app-panel, rgba(30, 15, 50, 0.7))', 
                                padding: '5px', 
                                borderRadius: '4px' 
                            }}
                        >
                            <span style={{ color: 'var(--app-text, #ffdd99)', fontWeight: 'bold', minWidth: '40px' }}>Lvl {level}:</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input 
                                type="number" 
                                placeholder="Total" 
                                value={profile[`slots${level}Total`]} 
                                onChange={e => setField(`slots${level}Total`, Number(e.target.value))}
                                className="input-dark"
                                style={{ width: '60px', padding: '3px', textAlign: 'center' }}
                                />
                                <input 
                                type="number" 
                                placeholder="Used" 
                                value={profile[`slots${level}Used`]} 
                                onChange={e => setField(`slots${level}Used`, Number(e.target.value))}
                                className="input-dark"
                                style={{ width: '60px', padding: '3px', textAlign: 'center' }}
                                />
                            </div>
                        </div>
                        ))}
                    </div>
                </section>
            </div>


            {/* BOTTOM ROW: Spell Search and List (Full Width) */}
            <section className="card mt-4">
                <h2 className="section-title">Spell Search & Addition</h2>
                
                <div className="spell-search-container">
                    <label htmlFor="spellSearch">Search Spells (API)</label>
                    <input 
                        type="text" 
                        placeholder="Search D&D spells..." 
                        value={spellSearchTerm}
                        onChange={e => setSpellSearchTerm(e.target.value)}
                        className="input-dark search-input"
                        style={{width: '100%'}}
                    />
                    
                    {spellSearchTerm.length > 2 && filteredSpells.length > 0 && (
                        <select 
                            onChange={handleSpellSearchSelect} 
                            value=""
                            size={Math.min(filteredSpells.length, 10)} 
                            style={{ width: '100%', marginTop: '5px', maxHeight: '200px', overflowY: 'auto' }}
                        >
                            <option value="" disabled>Select a Spell</option>
                            {filteredSpells.map(spell => (
                                <option key={spell.index} value={spell.index}>
                                    {spell.name} (Lvl {spell.level === 0 ? "Cantrip" : spell.level})
                                </option>
                            ))}
                        </select>
                    )}
                    
                    {spellSearchTerm.length > 2 && filteredSpells.length === 0 && (
                        <p style={{marginTop: '10px', color: 'var(--app-bg, #3a1d0f)'}}>No results found.</p>
                    )}
                </div>
                
                {selectedSpellDetail && (
                    <div className="spell-detail-preview card mt-3 p-3">
                        <h3 style={{color: 'var(--app-button-bg, #8b5a2b)', borderBottom: '1px solid var(--app-border, #6b4226)', paddingBottom: '5px'}}>{selectedSpellDetail.name} (Lvl {selectedSpellDetail.level === 0 ? "Cantrip" : selectedSpellDetail.level})</h3>
                        <p style={{color: 'var(--app-bg, #3a1d0f)'}}><strong>Casting Time:</strong> {selectedSpellDetail.casting_time}</p>
                        <p style={{color: 'var(--app-bg, #3a1d0f)'}}><strong>Range:</strong> {selectedSpellDetail.range}</p>
                        <p style={{color: 'var(--app-bg, #3a1d0f)'}}><strong>Duration:</strong> {selectedSpellDetail.duration}</p>
                        {selectedSpellDetail.desc && <p style={{color: 'var(--app-bg, #3a1d0f)'}}><strong>Description (Excerpt):</strong> {selectedSpellDetail.desc[0].substring(0, 150)}...</p>}
                        
                        <button 
                            className="btn-aura mt-2" 
                            onClick={() => addSpellToCharacter(selectedSpellDetail)}
                        >
                            + Add to Character
                        </button>
                    </div>
                )}
                
                <button className="btn-aura mt-3" onClick={addCustomSpell}>
                    + Add Custom Spell
                </button>
            </section>

            <section className="card mt-4">
                <h2 className="section-title">Character Spells</h2>
                <table className="spell-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Level</th>
                            <th>Time</th>
                            <th>Range</th>
                            <th>Duration (Conc.)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {profile.selectedSpells
                            .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                            .map((spell) => (
                                <tr key={spell.index}>
                                    <td>
                                        {spell.custom ? (
                                            <input 
                                                type="text" 
                                                value={spell.name}
                                                onChange={e => updateCustomSpellField(spell.index, 'name', e.target.value)}
                                                className="input-dark small-input"
                                                placeholder="Name"
                                            />
                                        ) : spell.name}
                                    </td>
                                    <td>
                                        {spell.custom ? (
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={spell.level}
                                                onChange={e => updateCustomSpellField(spell.index, 'level', e.target.value)}
                                                className="input-dark small-input"
                                                style={{width: '60px'}}
                                            />
                                        ) : (spell.level === 0 ? "Cantrip" : spell.level)}
                                    </td>
                                    <td>
                                        {spell.custom ? (
                                            <input type="text" value={spell.casting_time} onChange={e => updateCustomSpellField(spell.index, 'casting_time', e.target.value)} className="input-dark small-input" placeholder="Time"/>
                                        ) : spell.casting_time}
                                    </td>
                                    <td>
                                        {spell.custom ? (
                                            <input type="text" value={spell.range} onChange={e => updateCustomSpellField(spell.index, 'range', e.target.value)} className="input-dark small-input" placeholder="Range"/>
                                        ) : spell.range}
                                    </td>
                                    <td>
                                        {spell.custom ? (
                                            <input type="text" value={spell.duration} onChange={e => updateCustomSpellField(spell.index, 'duration', e.target.value)} className="input-dark small-input" placeholder="Duration"/>
                                        ) : `${spell.duration} ${spell.concentration ? "(Conc.)" : ""}`}
                                    </td>
                                    <td>
                                        <button className="btn-aura small" onClick={() => removeSpell(spell.index)}>
                                            X
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        {profile.selectedSpells.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign: 'center'}}>No spells added.</td></tr>
                        )}
                    </tbody>
                </table>
            </section>
          </section>
        )}
        
        {/* --- EQUIPMENT TAB --- */}
        {activeTab === "equipment" && (
          <section className="tab-page">
            <h2>Equipment</h2>
            <section className="card">
              <h2 className="section-title">Money</h2>
              {/* HASZNÁLJA A FRISSÍTETT grid-5 STÍLUSOSZTÁLYT */}
              <div className="grid-5 money-grid">
                <div><label>CP (Copper)</label><input type="number" value={profile.cp} onChange={e => setField("cp", Number(e.target.value))} className="input-dark" /></div>
                <div><label>SP (Silver)</label><input type="number" value={profile.sp} onChange={e => setField("sp", Number(e.target.value))} className="input-dark" /></div>
                <div><label>EP (Electrum)</label><input type="number" value={profile.ep} onChange={e => setField("ep", Number(e.target.value))} className="input-dark" /></div>
                <div><label>GP (Gold)</label><input type="number" value={profile.gp} onChange={e => setField("gp", Number(e.target.value))} className="input-dark" /></div>
                <div><label>PP (Platinum)</label><input type="number" value={profile.pp} onChange={e => setField("pp", Number(e.target.value))} className="input-dark" /></div>
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">General Equipment & Notes</h2>
              <textarea value={profile.equipment} onChange={e => setField("equipment", e.target.value)} className="textarea-dark" placeholder="Place general notes, carry capacity, or unlisted equipment here..." />
            </section>
            
            <section className="card">
                <h2 className="section-title">Item List (with Quantity)</h2>
                {(profile.generalEquipment || []).map((item, i) => (
                    <div key={i} className="item-card" style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                        
                        {/* Quantity Input */}
                        <label style={{ margin: 0, minWidth: '40px' }}>Qty:</label>
                        <input 
                            type="number" 
                            min="1"
                            value={item.quantity || 1} 
                            onChange={e => { 
                                const newItems = [...(profile.generalEquipment || [])]; 
                                newItems[i] = { ...newItems[i], quantity: Number(e.target.value) }; 
                                setField("generalEquipment", newItems); 
                            }} 
                            className="input-dark"
                            style={{ width: '60px', textAlign: 'center' }}
                        />
                        
                        <input 
                            type="text" 
                            placeholder="Item Name" 
                            value={item.name || ""} 
                            onChange={e => { 
                                const newItems = [...(profile.generalEquipment || [])]; 
                                newItems[i] = { ...newItems[i], name: e.target.value }; 
                                setField("generalEquipment", newItems); 
                            }} 
                            className="input-dark"
                            style={{ flexGrow: 1 }}
                        />
                        <input 
                            type="text" 
                            placeholder="Description / Notes" 
                            value={item.notes || ""} 
                            onChange={e => {
                                const newItems = [...(profile.generalEquipment || [])];
                                newItems[i] = { ...newItems[i], notes: e.target.value };
                                setField("generalEquipment", newItems);
                            }} 
                            className="input-dark"
                            style={{ flexGrow: 2 }}
                        />
                        <button className="btn-aura small" onClick={() => setField("generalEquipment", profile.generalEquipment.filter((_, idx) => idx !== i))}>X</button>
                    </div>
                ))}
                <button className="btn-aura mt-2" onClick={() => setField("generalEquipment", [...(profile.generalEquipment || []), { name: "", notes: "", quantity: 1 }])}>
                  + Add Item
                </button>
            </section>
          </section>
        )}

        {/* --- STORY TAB --- */}
        {activeTab === "story" && (
          <section className="tab-page">
            <h2>Story</h2>
            <div><label>Personality Traits</label><textarea value={profile.personalityTraits} onChange={e => setField("personalityTraits", e.target.value)} className="textarea-dark" /></div>
            <div><label>Ideals</label><textarea value={profile.ideals} onChange={e => setField("ideals", e.target.value)} className="textarea-dark" /></div>
            <div><label>Bonds</label><textarea value={profile.bonds} onChange={e => setField("bonds", e.target.value)} className="textarea-dark" /></div>
            <div><label>Flaws</label><textarea value={profile.flaws} onChange={e => setField("flaws", e.target.value)} className="textarea-dark" /></div>
            <div className="multi-textareas" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
              <textarea value={profile.allies} onChange={e => setField("allies", e.target.value)} placeholder="Allies & Organizations" className="textarea-dark" />
              <textarea value={profile.additionalFeatures} onChange={e => setField("additionalFeatures", e.target.value)} placeholder="Additional Features & Traits" className="textarea-dark" />
              <textarea value={profile.treasure} onChange={e => setField("treasure", e.target.value)} placeholder="Treasure" className="textarea-dark" />
              <textarea value={profile.backstory} onChange={e => setField("backstory", e.target.value)} placeholder="Backstory" className="textarea-dark" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}








