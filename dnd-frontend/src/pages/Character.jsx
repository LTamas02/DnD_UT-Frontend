import React, { useState, useEffect } from "react";
// 1. Import useParams from react-router-dom
import { useParams } from "react-router-dom";
import "../assets/styles/Character.css";
import {
  getAllSpells,
  getAllClasses,
  getClassByIndex,
  getWeapons,
  getAllRaces,
  getRaceByIndex
} from "../Api";

// Placeholder for the custom API function (implement this in your Api.js)
// This function must fetch a character object by ID from your .NET API.
async function getCharacterById(id) {
  const token = localStorage.getItem("token");
  // Replace with your actual endpoint and authentication logic
  const response = await fetch(`/api/characters/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Character not found or access denied.");
  const data = await response.json();
  return data; // Assuming this returns a character object matching DEFAULT_PROFILE structure
}

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const SKILL_MAP = {
  acrobatics: "dex", animalHandling: "wis", arcana: "int", athletics: "str",
  deception: "cha", history: "int", insight: "wis", intimidation: "cha",
  investigation: "int", medicine: "wis", nature: "int", perception: "wis",
  performance: "cha", persuasion: "cha", religion: "int", sleightOfHand: "dex",
  stealth: "dex", survival: "wis"
};

const DEFAULT_PROFILE = {
  characterName: "", race: "", raceIndex: "", classIndex: "", classLevel: 1, background: "",
  playerName: "", alignment: "", xp: 0, inspiration: false,
  profBonus: 2,
  age: "", height: "", weight: "", eyes: "", skin: "", hair: "",
  symbol: "", appearance: "",
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  saveProf: {}, skillProf: {}, passivePerception: 10,
  armor: 10, initiative: 0, speed: 30,
  hpMax: 0, hpCurrent: 0, hpTemp: 0,
  deathSuccesses: 0, deathFailures: 0,
  attacks: [],
  // Added generalEquipment and customItems to match your Equipment tab logic
  generalEquipment: [], customItems: [],
  equipment: "", cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
  personalityTraits: "", ideals: "", bonds: "", flaws: "",
  allies: "", additionalFeatures: "", treasure: "", backstory: "",
  spells: [],
  spellSlots: [],
  newItemName: "", newItemType: "", newItemDesc: ""
};

// helper to normalize api return
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
  // 2. Get the 'id' from the URL parameters
  const { id } = useParams();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState("identity");
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [allSpells, setAllSpells] = useState([]);
  const [allWeapons, setAllWeapons] = useState([]);
  const [allRaces, setAllRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  // 3. Add loading state for the main character data
  const [isLoading, setIsLoading] = useState(!!id);

  // --- FETCH D&D DATA (CLASSES, SPELLS, etc.) ---
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const classes = await getAllClasses();
        if (mounted) setAllClasses(Array.isArray(classes) ? classes : normalizeArrayResponse(classes));

        const sres = await getAllSpells();
        if (mounted) setAllSpells(normalizeArrayResponse(sres));

        const wres = await getWeapons();
        if (mounted) setAllWeapons(normalizeArrayResponse(wres));

        const races = await getAllRaces();
        if (mounted) setAllRaces(normalizeArrayResponse(races));
      } catch (err) {
        console.error("Failed to fetch dnd data", err);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  // --- FETCH CHARACTER DATA ---
  useEffect(() => {
    let mounted = true;
    const fetchCharacter = async () => {
      if (!id) {
        setProfile(DEFAULT_PROFILE); // Reset or use default for new character
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const charData = await getCharacterById(id);
        if (mounted) {
          // Merge fetched data with default to ensure all fields exist
          setProfile(prev => ({
            ...DEFAULT_PROFILE,
            ...charData,
            // Ensure nested objects are initialized if null/undefined in API response
            saveProf: charData.saveProf || {},
            skillProf: charData.skillProf || {},
            attacks: charData.attacks || [],
            spells: charData.spells || [],
            generalEquipment: charData.generalEquipment || [],
            customItems: charData.customItems || [],
          }));
        }
      } catch (err) {
        console.error(`Failed to load character ${id}`, err);
        // Optionally navigate to an error page or character list
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchCharacter();
    return () => { mounted = false; };
  }, [id]); // Rerun when ID changes

  // generic setter
  const setField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleSaveProf = key => {
    setProfile(prev => ({
      ...prev,
      saveProf: { ...prev.saveProf, [key]: !prev.saveProf[key] }
    }));
  };

  const toggleSkillProf = key => {
    setProfile(prev => ({
      ...prev,
      skillProf: { ...prev.skillProf, [key]: !prev.skillProf[key] }
    }));
  };

  const getMod = val => Math.floor((val - 10) / 2);
  const calcSaving = key => getMod(profile[key] || 10) + ((profile.saveProf && profile.saveProf[key]) ? profile.profBonus : 0);
  const calcSkill = key => {
    const ab = SKILL_MAP[key];
    return getMod(profile[ab] || 10) + ((profile.skillProf && profile.skillProf[key]) ? profile.profBonus : 0);
  };
  const capitalizeWords = s => s.charAt(0).toUpperCase() + s.slice(1);

  // --- CLASS & PROFICIENCY MANAGEMENT (Keep existing logic) ---
  useEffect(() => {
    let mounted = true;
    const updateClass = async () => {
      if (!profile.classIndex) {
        setSelectedClass(null);
        return;
      }
      try {
        const cls = await getClassByIndex(profile.classIndex);
        const clsData = cls?.data ? cls.data : cls;
        if (!mounted) return;
        setSelectedClass(clsData || null);

        const pb = getProfBonusFromLevel(profile.classLevel);
        setProfile(prev => {
          const newSaveProf = { ...prev.saveProf };
          if (clsData?.saving_throws) {
            clsData.saving_throws.forEach(st => {
              const name = (st.name || st.index || "").toString().toLowerCase();
              const key = ABILITIES.find(a => name.startsWith(a));
              if (key) newSaveProf[key] = true;
            });
          }

          let slots = prev.spellSlots || [];
          if (clsData?.spellcasting?.spell_slots) {
            slots = clsData.spellcasting.spell_slots.map(s => s);
          }

          return { ...prev, profBonus: pb, saveProf: newSaveProf, spellSlots: slots };
        });
      } catch (err) {
        console.error("Failed to load class details", err);
      }
    };
    updateClass();
    return () => { mounted = false; };
  }, [profile.classIndex, profile.classLevel]);

  // --- RACE MANAGEMENT (Keep existing logic) ---
  const updateRace = async (raceIndex) => {
    setField("raceIndex", raceIndex);
    const raceDataRaw = await getRaceByIndex(raceIndex);
    const raceData = raceDataRaw?.data || raceDataRaw;
    setSelectedRace(raceData || null);
    if (!raceData) return;

    const speed = raceData.speed || 30;
    const newStats = { ...profile };
    if (raceData.ability_bonuses) {
      raceData.ability_bonuses.forEach(ab => {
        const key = ab.ability_score?.index || ab.ability_score?.name?.toLowerCase().slice(0, 3);
        if (key && ABILITIES.includes(key)) {
          newStats[key] += ab.bonus || 0;
        }
      });
    }
    setProfile(prev => ({ ...prev, ...newStats, speed }));
  };

  // --- ATTACK MANAGEMENT (Keep existing logic) ---
  const addAttack = () => setProfile(prev => ({ ...prev, attacks: [...prev.attacks, { name: "", bonus: "", damage: "", weaponIndex: "" }] }));
  const updateAttack = (index, field, value) => {
    const newAttacks = [...(profile.attacks || [])];
    if (field === "weaponIndex") {
      if (!value) {
        newAttacks[index] = { name: "", bonus: "", damage: "", weaponIndex: "" };
      } else {
        const weapon = allWeapons.find(w => w.index === value);
        if (!weapon) {
          newAttacks[index] = { ...newAttacks[index], weaponIndex: value };
        } else {
          const isFinesse = (Array.isArray(weapon.properties) && weapon.properties.some(p => p.name?.toLowerCase().includes("finesse")))
            || (weapon.property_category && weapon.property_category.toLowerCase().includes("finesse"));
          const isRanged = weapon.weapon_range && weapon.weapon_range.toLowerCase && weapon.weapon_range.toLowerCase() !== "melee";
          const abilityMod = (isFinesse || isRanged) ? getMod(profile.dex) : getMod(profile.str);

          let hasProf = false;
          if (selectedClass?.proficiencies) {
            const profStrings = selectedClass.proficiencies.map(p => (p.name || p).toString().toLowerCase());
            const wc = (weapon.weapon_category || "").toLowerCase();
            if (profStrings.some(ps => ps.includes(wc) && ps.includes("weapon"))) hasProf = true;
            if (!hasProf && profStrings.some(ps => weapon.name.toLowerCase().includes(ps))) hasProf = true;
            if (!hasProf && wc && profStrings.includes(`${wc} weapons`)) hasProf = true;
          }

          const bonus = abilityMod + (hasProf ? (profile.profBonus || getProfBonusFromLevel(profile.classLevel)) : 0);
          const damageDice = weapon.damage?.damage_dice || weapon.damage?.dice || weapon.damage?.damage || "";
          newAttacks[index] = { name: weapon.name, bonus, damage: damageDice, weaponIndex: value };
        }
      }
    } else {
      newAttacks[index] = { ...(newAttacks[index] || {}), [field]: value };
    }
    setProfile(prev => ({ ...prev, attacks: newAttacks }));
  };
  const removeAttack = index => setProfile(prev => ({ ...prev, attacks: (prev.attacks || []).filter((_, i) => i !== index) }));

  // --- SPELL MANAGEMENT (Keep existing logic) ---
  const getSpellByIndex = idx => (allSpells || []).find(s => s.index === idx);
  const removeSpell = index => {
    const newSpells = [...(profile.spells || [])];
    newSpells.splice(index, 1);
    setProfile(prev => ({ ...prev, spells: newSpells }));
  };

  // --- PASSIVE PERCEPTION (Keep existing logic) ---
  useEffect(() => {
    const p = 10 + getMod(profile.wis || 10) + ((profile.skillProf?.perception) ? (profile.profBonus || getProfBonusFromLevel(profile.classLevel)) : 0);
    setProfile(prev => ({ ...prev, passivePerception: p }));
  }, [profile.wis, profile.skillProf, profile.profBonus]);

  // --- HP CALCULATION (Keep existing logic) ---
  useEffect(() => {
    if (!selectedClass) return;
    const hitDie = selectedClass.hit_die || 8;
    const conMod = getMod(profile.con);
    let hp = hitDie + conMod; // level 1
    for (let lvl = 2; lvl <= profile.classLevel; lvl++) {
      hp += Math.floor(hitDie / 2 + 1) + conMod; // average
    }
    setProfile(prev => ({ ...prev, hpMax: hp, hpCurrent: prev.hpCurrent > 0 ? prev.hpCurrent : hp })); // Retain current HP if loaded, otherwise set to max
  }, [selectedClass, profile.classLevel, profile.con]);

  // --- RENDER ---

  // Display a loading indicator while character data is being fetched
  if (isLoading) {
    return (
      <div className="character-app loading">
        <h1>Loading Character...</h1>
      </div>
    );
  }

  return (
    <div className="character-app">
      <aside className="sidebar gothic-border">
        <div className="sidebar-header">
          <div className="sidebar-name">{profile.characterName || (id ? "Loading Failed" : "New Character")}</div>
          <div className="sidebar-class">{profile.classIndex ? `${profile.classIndex} ${profile.classLevel}` : "Class & Level"}</div>
        </div>
        <nav className="sidebar-nav">
          {["identity", "stats", "combat", "equipment", "story"].map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " / ")}
            </button>
          ))}
        </nav>
      </aside>

      <main className="page-container">
        {/* --- IDENTITY --- */}
        {activeTab === "identity" && (
          <section className="tab-page">
            <h2>Identity</h2>
            <div className="grid-4">
              <div>
                <label>Name</label>
                <input value={profile.characterName} onChange={e => setField("characterName", e.target.value)} />
              </div>
              <div>
                <label>Race</label>
                <select value={profile.raceIndex || ""} onChange={e => updateRace(e.target.value)}>
                  <option value="">Select Race</option>
                  {allRaces.map(r => (
                    <option key={r.index} value={r.index}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Class</label>
                <select value={profile.classIndex || ""} onChange={async e => {
                  const clsIndex = e.target.value;
                  setField("classIndex", clsIndex);
                }}>
                  <option value="">Select Class</option>
                  {allClasses.map(cls => (<option key={cls.index} value={cls.index}>{cls.name}</option>))}
                </select>
              </div>
              <div>
                <label>Level</label>
                <input type="number" min="1" value={profile.classLevel} onChange={e => {
                  const lvl = Number(e.target.value) || 1;
                  setField("classLevel", lvl);
                  setProfile(prev => ({ ...prev, profBonus: getProfBonusFromLevel(lvl) }));
                }} />
              </div>
            </div>

            {selectedClass && (
              <div className="class-info card">
                <h4>{selectedClass.name}</h4>
                <div><strong>Proficiency bonus:</strong> {getProfBonusFromLevel(profile.classLevel)}</div>
                <div><strong>Saving throw profs:</strong> {selectedClass.saving_throws?.map(s => s.name || s).join(", ") || "—"}</div>
                <div><strong>Proficiencies:</strong> {selectedClass.proficiencies?.map(p => p.name || p).join(", ") || "—"}</div>
                {selectedClass.spellcasting && <div><strong>Spellcasting:</strong> available (see Combat tab)</div>}
              </div>
            )}

            {selectedRace && (
              <div className="race-info card">
                <h4>{selectedRace.name}</h4>
                <div><strong>Speed:</strong> {selectedRace.speed}</div>
                <div><strong>Ability Bonuses:</strong> {selectedRace.ability_bonuses?.map(ab => `${ab.ability_score?.name} +${ab.bonus}`).join(", ") || "—"}</div>
              </div>
            )}
          </section>
        )}

        {/* --- STATS --- (Remains the same) */}
        {activeTab === "stats" && (
          <section className="tab-page">
            <h2>Abilities, Saving Throws & Skills</h2>
            <div className="ability-grid">
              {ABILITIES.map(a => (
                <div key={a} className="ability">
                  <span>{a.toUpperCase()}</span>
                  <input type="number" value={profile[a]} onChange={e => setField(a, Number(e.target.value))} />
                  <span className="mod-pill">{getMod(profile[a]) >= 0 ? "+" : ""}{getMod(profile[a])}</span>
                </div>
              ))}
            </div>

            <h3>Saving Throws</h3>
            <div className="saves-grid">
              {ABILITIES.map(a => (
                <div key={a}>
                  <label>
                    <input type="checkbox" checked={!!profile.saveProf[a]} onChange={() => toggleSaveProf(a)} /> {capitalizeWords(a)}
                  </label>
                  <input value={(calcSaving(a) >= 0 ? "+" : "") + calcSaving(a)} readOnly />
                </div>
              ))}
            </div>

            <h3>Skills</h3>
            <div className="skill-list">
              {Object.keys(SKILL_MAP).map(sk => (
                <div key={sk}>
                  <label><input type="checkbox" checked={profile.skillProf[sk] || false} onChange={() => toggleSkillProf(sk)} /> {capitalizeWords(sk)} ({SKILL_MAP[sk].toUpperCase()})</label>
                  <input value={(calcSkill(sk) >= 0 ? "+" : "") + calcSkill(sk)} readOnly />
                </div>
              ))}
            </div>

            <div>
              <label>Passive Perception</label>
              <input value={profile.passivePerception} readOnly />
            </div>
          </section>
        )}

        {/* --- COMBAT --- (Remains the same) */}
        {activeTab === "combat" && (
          <section className="tab-page">
            <h2>Combat</h2>
            <div className="grid-3">
              <div><label>Armor Class</label><input type="number" value={profile.armor} onChange={e => setField("armor", Number(e.target.value))} /></div>
              <div><label>Initiative</label><input type="number" value={profile.initiative} onChange={e => setField("initiative", Number(e.target.value))} /></div>
              <div><label>Speed</label><input type="number" value={profile.speed} onChange={e => setField("speed", Number(e.target.value))} /></div>
            </div>

            <div className="grid-3">
              <div><label>HP Max</label><input type="number" value={profile.hpMax} onChange={e => setField("hpMax", Number(e.target.value))} /></div>
              <div><label>Current HP</label><input type="number" value={profile.hpCurrent} onChange={e => setField("hpCurrent", Number(e.target.value))} /></div>
              <div><label>Temp HP</label><input type="number" value={profile.hpTemp} onChange={e => setField("hpTemp", Number(e.target.value))} /></div>
            </div>

            <div className="grid-2">
              <div><label>Death Saves Successes</label><input type="number" min="0" max="3" value={profile.deathSuccesses} onChange={e => setField("deathSuccesses", Number(e.target.value))} /></div>
              <div><label>Death Saves Failures</label><input type="number" min="0" max="3" value={profile.deathFailures} onChange={e => setField("deathFailures", Number(e.target.value))} /></div>
            </div>

            <h3>Attacks</h3>
            {(profile.attacks || []).map((atk, i) => (
              <div key={i} className="attack-row">
                <select value={atk.weaponIndex || ""} onChange={e => updateAttack(i, "weaponIndex", e.target.value)}>
                  <option value="">Select Weapon</option>
                  {(allWeapons || []).map(w => (<option key={w.index} value={w.index}>{w.name}</option>))}
                </select>
                <input placeholder="Bonus" value={atk.bonus !== undefined ? atk.bonus : ""} readOnly />
                <input placeholder="Damage" value={atk.damage !== undefined ? atk.damage : ""} readOnly />
                <button onClick={() => removeAttack(i)}>X</button>
              </div>
            ))}
            <button onClick={addAttack}>Add Attack</button>

            {selectedClass?.spellcasting && (
              <>
                <h3>Spell Slots</h3>
                {(selectedClass.spellcasting.spell_slots || []).map((slots, lvl) => (
                  <div key={lvl} className="slot-row">
                    <label>Level {lvl + 1}</label>
                    <input type="number" value={profile.spellSlots?.[lvl] ?? slots} onChange={e => {
                      const newSlots = [...(profile.spellSlots || [])]; newSlots[lvl] = Number(e.target.value);
                      setProfile(prev => ({ ...prev, spellSlots: newSlots }));
                    }} />
                    <span>/ {slots}</span>
                  </div>
                ))}
              </>
            )}

            <h3>Spells</h3>
            {(profile.spells || []).map((sp, i) => (
              <div key={i} className="spell-row">
                <select value={sp.index || ""} onChange={e => {
                  const idx = e.target.value; const spell = getSpellByIndex(idx);
                  const newSpells = [...(profile.spells || [])];
                  if (spell) newSpells[i] = { index: spell.index, name: spell.name, level: spell.level, range: spell.range, duration: spell.duration, casting_time: spell.casting_time, components: spell.components };
                  else newSpells[i] = {};
                  setProfile(prev => ({ ...prev, spells: newSpells }));
                }}>
                  <option value="">Select Spell</option>
                  {(allSpells || []).map(s => (<option key={s.index} value={s.index}>{s.name}</option>))}
                </select>
                {sp?.name && (
                  <div className="spell-details">
                    <strong>{sp.name}</strong> — Level: {sp.level} | Range: {sp.range} | Duration: {sp.duration} | Cast: {sp.casting_time}
                    {sp.components ? <> | Components: {Array.isArray(sp.components) ? sp.components.join(", ") : sp.components}</> : null}
                  </div>
                )}
                <button onClick={() => removeSpell(i)}>Delete</button>
              </div>
            ))}
            <button onClick={() => setProfile(prev => ({ ...prev, spells: [...(prev.spells || []), {}] }))}>Add Spell</button>
          </section>
        )}

        {/* --- EQUIPMENT --- (General Equipment list was added based on your tab-content logic) */}
        {activeTab === "equipment" && (
          <section className="tab-page">
            <h2>Equipment & Coins</h2>

            {/* General Equipment list (Custom Item style) */}
            {(profile.generalEquipment || []).map((item, i) => (
              <div key={i} className="item-card">
                <div className="item-row">
                  <input
                    type="text"
                    placeholder="Item Name"
                    value={item.name || ""}
                    onChange={e => {
                      const newItems = [...(profile.generalEquipment || [])];
                      newItems[i] = { ...newItems[i], name: e.target.value };
                      setField("generalEquipment", newItems);
                    }}
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
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={e => {
                      const newItems = [...(profile.generalEquipment || [])];
                      newItems[i] = { ...newItems[i], quantity: Number(e.target.value) || 1 };
                      setField("generalEquipment", newItems);
                    }}
                    style={{ width: "70px" }}
                  />
                  <button onClick={() => {
                    const newItems = (profile.generalEquipment || []).filter((_, idx) => idx !== i);
                    setField("generalEquipment", newItems);
                  }}>X</button>
                </div>
              </div>
            ))}

            <button onClick={() => {
              setField("generalEquipment", [...(profile.generalEquipment || []), { name: "", notes: "", quantity: 1 }]);
            }}>Add Item</button>


            {/* Coins */}
            <h3>Coins</h3>
            <div className="coins-grid">
              {["cp", "sp", "ep", "gp", "pp"].map(c => (
                <div key={c} className="coin-card">
                  <label>{c.toUpperCase()}</label>
                  <input
                    type="number"
                    value={profile[c] || 0}
                    onChange={e => setField(c, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>

            <h3>Custom Items</h3>
            <div className="custom-item-row">
              <input placeholder="Name" value={profile.newItemName} onChange={e => setField("newItemName", e.target.value)} />
              <input placeholder="Type" value={profile.newItemType} onChange={e => setField("newItemType", e.target.value)} />
              <input placeholder="Description" value={profile.newItemDesc} onChange={e => setField("newItemDesc", e.target.value)} />
              <button onClick={() => {
                if (!profile.newItemName) return;
                const newList = [...(profile.customItems || []), { name: profile.newItemName, type: profile.newItemType, desc: profile.newItemDesc }];
                setProfile(prev => ({ ...prev, customItems: newList, newItemName: "", newItemType: "", newItemDesc: "" }));
              }}>Add</button>
            </div>

            <div className="equipment-list">
              {(profile.customItems || []).map((item, i) => (
                <div key={i} className="equipment-card">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.type} — {item.desc}</span>
                  </div>
                  <button onClick={() => {
                    const newList = (profile.customItems || []).filter((_, idx) => idx !== i);
                    setProfile(prev => ({ ...prev, customItems: newList }));
                  }}>Delete</button>
                </div>
              ))}
            </div>

          </section>
        )}


        {/* --- STORY --- (Remains the same) */}
        {activeTab === "story" && (
          <section className="tab-page">
            <h2>Story</h2>
            <div><label>Personality Traits</label><textarea value={profile.personalityTraits} onChange={e => setField("personalityTraits", e.target.value)} /></div>
            <div><label>Ideals</label><textarea value={profile.ideals} onChange={e => setField("ideals", e.target.value)} /></div>
            <div><label>Bonds</label><textarea value={profile.bonds} onChange={e => setField("bonds", e.target.value)} /></div>
            <div><label>Flaws</label><textarea value={profile.flaws} onChange={e => setField("flaws", e.target.value)} /></div>
            <div className="multi-textareas">
              <textarea value={profile.allies} onChange={e => setField("allies", e.target.value)} placeholder="Allies" />
              <textarea value={profile.additionalFeatures} onChange={e => setField("additionalFeatures", e.target.value)} placeholder="Additional Features" />
              <textarea value={profile.treasure} onChange={e => setField("treasure", e.target.value)} placeholder="Treasure" />
              <textarea value={profile.backstory} onChange={e => setField("backstory", e.target.value)} placeholder="Backstory" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}