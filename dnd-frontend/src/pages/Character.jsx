import React, { useState, useEffect } from "react";
import "../assets/styles/Character.css";
import {
  getAllSpells,
  getAllClasses,
  getClassByIndex,
  getWeapons
} from "../Api";

const ABILITIES = ["str","dex","con","int","wis","cha"];
const SKILL_MAP = {
  acrobatics: "dex", animalHandling: "wis", arcana: "int", athletics: "str",
  deception: "cha", history: "int", insight: "wis", intimidation: "cha",
  investigation: "int", medicine: "wis", nature: "int", perception: "wis",
  performance: "cha", persuasion: "cha", religion: "int", sleightOfHand: "dex",
  stealth: "dex", survival: "wis"
};

const DEFAULT_PROFILE = {
  characterName: "", race: "", classIndex: "", classLevel: 1, background: "",
  playerName: "", alignment: "", xp: 0, inspiration: false,
  profBonus: 2,
  age: "", height: "", weight: "", eyes: "", skin: "", hair: "",
  symbol: "", appearance: "",
  str:10,dex:10,con:10,int:10,wis:10,cha:10,
  saveProf:{}, skillProf:{}, passivePerception:10,
  armor:10, initiative:0, speed:30,
  hpMax:0, hpCurrent:0, hpTemp:0,
  deathSuccesses:0, deathFailures:0,
  attacks:[],
  equipment:"", cp:0, sp:0, ep:0, gp:0, pp:0,
  personalityTraits:"", ideals:"", bonds:"", flaws:"",
  allies:"", additionalFeatures:"", treasure:"", backstory:"",
  spells: [],
  spellSlots: []
};

export default function Character() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState("identity");
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [allSpells, setAllSpells] = useState([]);
  const [allWeapons, setAllWeapons] = useState([]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchClasses = async () => {
      const classes = await getAllClasses();
      setAllClasses(classes);
    };
    const fetchSpells = async () => {
      const res = await getAllSpells();
      setAllSpells(res?.data || []);
    };
    const fetchWeapons = async () => {
      const res = await getWeapons();
      setAllWeapons(res || []);
    };
    fetchClasses();
    fetchSpells();
    fetchWeapons();
  }, []);

  const setField = (field, value) => {
    setProfile(prev => ({...prev, [field]: value}));
  };

  const toggleSaveProf = key => {
    setProfile(prev => ({
      ...prev,
      saveProf:{...prev.saveProf, [key]: !prev.saveProf[key]}
    }));
  };

  const toggleSkillProf = key => {
    setProfile(prev => ({
      ...prev,
      skillProf:{...prev.skillProf, [key]: !prev.skillProf[key]}
    }));
  };

  const getMod = val => Math.floor((val - 10) / 2);

  const calcSaving = key => getMod(profile[key]) + (profile.saveProf[key] ? profile.profBonus : 0);

  const calcSkill = key => {
    const ab = SKILL_MAP[key];
    return getMod(profile[ab]) + (profile.skillProf[key] ? profile.profBonus : 0);
  };

  const capitalizeWords = str => str.charAt(0).toUpperCase() + str.slice(1);

  // --- ATTACK MANAGEMENT ---
  const addAttack = () => {
    setProfile(prev => ({...prev, attacks:[...prev.attacks,{name:"",bonus:"",damage:"",weaponIndex:""}]}));
  };

  const updateAttack = (index, field, value) => {
    const newAttacks = [...profile.attacks];

    if(field === "weaponIndex" && value !== "") {
      const weapon = allWeapons.find(w => w.index === value);
      if(weapon) {
        const abilityMod = (weapon.property_category === "Finesse" || weapon.weapon_category === "Ranged")
          ? getMod(profile.dex)
          : getMod(profile.str);

        // Weapon proficiency check
        const profNames = selectedClass?.proficiencies?.map(p => p.name) || [];
        const hasProf = profNames.some(name => 
          weapon.weapon_category.includes(name) || weapon.name.includes(name)
        );

        const bonus = abilityMod + (hasProf ? profile.profBonus : 0);

        newAttacks[index] = {
          name: weapon.name,
          bonus: bonus,
          damage: weapon.damage?.damage_dice || "",
          weaponIndex: value
        };
      }
    } else {
      newAttacks[index][field] = value;
    }

    setProfile(prev => ({...prev, attacks:newAttacks}));
  };

  const removeAttack = index => {
    const newAttacks = profile.attacks.filter((_,i)=>i!==index);
    setProfile(prev => ({...prev, attacks:newAttacks}));
  };

  // --- PROFICIENCY BONUS & SPELLS DYNAMIC UPDATE ---
  useEffect(() => {
    if(selectedClass) {
      const profBonus = selectedClass.proficiency_bonus || 2;

      const spellSlots = selectedClass.spellcasting?.spell_slots?.map(sl => sl) || [];

      setProfile(prev => ({
        ...prev,
        profBonus,
        spellSlots
      }));
    }
  }, [selectedClass, profile.classLevel]);

  return (
    <div className="character-app">
      <aside className="sidebar gothic-border">
        <div className="sidebar-header">
          <div className="sidebar-name">{profile.characterName || "Unnamed"}</div>
          <div className="sidebar-class">{profile.classIndex ? `${profile.classIndex} ${profile.classLevel}` : "Class & Level"}</div>
        </div>
        <nav className="sidebar-nav">
          {["identity","stats","combat","equipment","story"].map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab===tab?"active":""}`}
              onClick={()=>setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-"," / ")}
            </button>
          ))}
        </nav>
      </aside>

      <main className="page-container">
        {/* IDENTITY */}
        {activeTab==="identity" && (
          <section className="tab-page">
            <h2>Identity</h2>
            <div className="grid-4">
              <div>
                <label>Name</label>
                <input value={profile.characterName} onChange={e=>setField("characterName",e.target.value)} />
              </div>
              <div>
                <label>Race</label>
                <input value={profile.race} onChange={e=>setField("race",e.target.value)} />
              </div>
              <div>
                <label>Class</label>
                <select
                  value={profile.classIndex || ""}
                  onChange={async e=>{
                    const clsIndex = e.target.value;
                    setField("classIndex", clsIndex);
                    const clsData = await getClassByIndex(clsIndex);
                    setSelectedClass(clsData);
                  }}
                >
                  <option value="">Select Class</option>
                  {allClasses.map(cls=>(
                    <option key={cls.index} value={cls.index}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Level</label>
                <input type="number" min="1" value={profile.classLevel} onChange={e=>setField("classLevel", Number(e.target.value))} />
              </div>
            </div>
          </section>
        )}

        {/* STATS */}
        {activeTab==="stats" && (
          <section className="tab-page">
            <h2>Abilities, Saving Throws & Skills</h2>
            <div className="ability-grid">
              {ABILITIES.map(a=>(
                <div key={a} className="ability">
                  <span>{a.toUpperCase()}</span>
                  <input type="number" value={profile[a]} onChange={e=>setField(a,Number(e.target.value))} />
                  <span className="mod-pill">{getMod(profile[a])>=0?"+":""}{getMod(profile[a])}</span>
                </div>
              ))}
            </div>
            <h3>Saving Throws</h3>
            <div className="saves-grid">
              {ABILITIES.map(a=>(
                <div key={a}>
                  <label><input type="checkbox" checked={profile.saveProf[a]||false} onChange={()=>toggleSaveProf(a)} /> {capitalizeWords(a)}</label>
                  <input value={calcSaving(a)} readOnly />
                </div>
              ))}
            </div>
            <h3>Skills</h3>
            <div className="skill-list">
              {Object.keys(SKILL_MAP).map(sk=>(
                <div key={sk}>
                  <label><input type="checkbox" checked={profile.skillProf[sk]||false} onChange={()=>toggleSkillProf(sk)} /> {capitalizeWords(sk)} ({SKILL_MAP[sk].toUpperCase()})</label>
                  <input value={calcSkill(sk)} readOnly />
                </div>
              ))}
            </div>
            <div>
              <label>Passive Perception</label>
              <input value={profile.passivePerception} readOnly />
            </div>
          </section>
        )}

        {/* COMBAT */}
        {activeTab==="combat" && (
          <section className="tab-page">
            <h2>Combat</h2>
            <div className="grid-3">
              <div><label>Armor Class (AC)</label><input type="number" value={profile.armor} onChange={e=>setField("armor",Number(e.target.value))} /></div>
              <div><label>Initiative</label><input type="number" value={profile.initiative} onChange={e=>setField("initiative",Number(e.target.value))} /></div>
              <div><label>Speed</label><input type="number" value={profile.speed} onChange={e=>setField("speed",Number(e.target.value))} /></div>
            </div>
            <div className="grid-3">
              <div><label>HP Max</label><input type="number" value={profile.hpMax} onChange={e=>setField("hpMax",Number(e.target.value))} /></div>
              <div><label>Current HP</label><input type="number" value={profile.hpCurrent} onChange={e=>setField("hpCurrent",Number(e.target.value))} /></div>
              <div><label>Temp HP</label><input type="number" value={profile.hpTemp} onChange={e=>setField("hpTemp",Number(e.target.value))} /></div>
            </div>
            <div className="grid-2">
              <div><label>Death Saves Successes</label><input type="number" min="0" max="3" value={profile.deathSuccesses} onChange={e=>setField("deathSuccesses",Number(e.target.value))} /></div>
              <div><label>Death Saves Failures</label><input type="number" min="0" max="3" value={profile.deathFailures} onChange={e=>setField("deathFailures",Number(e.target.value))} /></div>
            </div>

            <h3>Attacks</h3>
            <div>
              {(profile.attacks || []).map((atk,i)=>(
                <div key={i} className="attack-row">
                  <select value={atk.weaponIndex||""} onChange={e=>updateAttack(i,"weaponIndex",e.target.value)}>
                    <option value="">Select Weapon</option>
                    {(allWeapons || []).map(w=>(
                      <option key={w.index} value={w.index}>{w.name}</option>
                    ))}
                  </select>
                  <input placeholder="Bonus" value={atk.bonus} readOnly />
                  <input placeholder="Damage" value={atk.damage} readOnly />
                  <button onClick={()=>removeAttack(i)}>X</button>
                </div>
              ))}
              <button onClick={addAttack}>Add Attack</button>
            </div>

            {/* Spell Slots */}
            {selectedClass?.spellcasting && (
              <>
                <h3>Spell Slots</h3>
                {(selectedClass.spellcasting.spell_slots || []).map((slots,lvl)=>(
                  <div key={lvl}>
                    <label>Level {lvl+1}</label>
                    <input
                      type="number"
                      value={profile.spellSlots?.[lvl] ?? slots}
                      onChange={e=>{
                        const newSlots = [...(profile.spellSlots||[])];
                        newSlots[lvl] = Number(e.target.value);
                        setProfile(prev=>({...prev, spellSlots:newSlots}));
                      }}
                    />
                    / {slots}
                  </div>
                ))}
              </>
            )}

            {/* Spells */}
            <h3>Spells</h3>
            {(profile.spells || []).map((sp,i)=>(
              <div key={i}>
                <select value={sp.index||""} onChange={e=>{
                  const spell = allSpells.find(s=>s.index===e.target.value);
                  const newSpells = [...profile.spells];
                  if(spell) newSpells[i] = {
                    index: spell.index,
                    name: spell.name,
                    level: spell.level,
                    range: spell.range,
                    duration: spell.duration,
                    casting_time: spell.casting_time
                  };
                  setProfile(prev=>({...prev, spells:newSpells}));
                }}>
                  <option value="">Select Spell</option>
                  {(allSpells || []).map(s=>(<option key={s.index} value={s.index}>{s.name}</option>))}
                </select>
                {sp.name && (
                  <span> | Level: {sp.level}, Range: {sp.range}, Duration: {sp.duration}, Cast Time: {sp.casting_time}</span>
                )}
              </div>
            ))}
            <button onClick={()=>setProfile(prev=>({...prev, spells:[...(prev.spells||[]),{}]}))}>Add Spell</button>
          </section>
        )}

        {/* EQUIPMENT */}
        {activeTab==="equipment" && (
          <section className="tab-page">
            <h2>Equipment & Coins</h2>
            <textarea value={profile.equipment} onChange={e=>setField("equipment",e.target.value)} />
            <div className="grid-5">
              {["cp","sp","ep","gp","pp"].map(c=>(
                <div key={c}><label>{c.toUpperCase()}</label><input type="number" value={profile[c]} onChange={e=>setField(c,Number(e.target.value))} /></div>
              ))}
            </div>
          </section>
        )}

        {/* STORY */}
        {activeTab==="story" && (
          <section className="tab-page">
            <h2>Story</h2>
            <div><label>Personality Traits</label><textarea value={profile.personalityTraits} onChange={e=>setField("personalityTraits",e.target.value)} /></div>
            <div><label>Ideals</label><textarea value={profile.ideals} onChange={e=>setField("ideals",e.target.value)} /></div>
            <div><label>Bonds</label><textarea value={profile.bonds} onChange={e=>setField("bonds",e.target.value)} /></div>
            <div><label>Flaws</label><textarea value={profile.flaws} onChange={e=>setField("flaws",e.target.value)} /></div>
            <div><label>Allies / Additional / Treasure / Backstory</label>
              <textarea value={profile.allies} onChange={e=>setField("allies",e.target.value)} placeholder="Allies" />
              <textarea value={profile.additionalFeatures} onChange={e=>setField("additionalFeatures",e.target.value)} placeholder="Additional Features" />
              <textarea value={profile.treasure} onChange={e=>setField("treasure",e.target.value)} placeholder="Treasure" />
              <textarea value={profile.backstory} onChange={e=>setField("backstory",e.target.value)} placeholder="Backstory" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
