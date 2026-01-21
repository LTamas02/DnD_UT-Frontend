import axios from "axios";
import { startLoading, stopLoading } from "./loadingStore";

export const API_BASE = "https://api.dnd-tool.com";
//export const API_BASE = "http://localhost:5188";
const api = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
        "Content-Type": "application/json"
    }
});

const apiSilent = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use(
    (config) => {
        startLoading();
        return config;
    },
    (error) => {
        stopLoading();
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        stopLoading();
        return response;
    },
    (error) => {
        stopLoading();
        return Promise.reject(error);
    }
);

// Books (markdown) endpoints
export const getMarkdownBooks = () =>
    api.get("/books/markdown");

export const getMarkdownBookContent = (fileName) =>
    api.get(`/books/markdown/${encodeURIComponent(fileName)}`, {
        responseType: "text"
    });

export const getMarkdownBookContentSilent = (fileName, config = {}) =>
    apiSilent.get(`/books/markdown/${encodeURIComponent(fileName)}`, {
        responseType: "text",
        ...config
    });





export const register = (email, username, password) =>
    api.post("Auth/register", null, {
        params: { email, username, password }
    });

export const login = (email, password) =>
    api.post("Auth/login", null, {
        params: { email, password }
    });

export const getSalt = (email) =>
    api.get("Auth/salt", {
        params: { email }
    });

export const saltSend = (email, salt) =>
    api.post("auth/salt-send", {
        email,
        salt
    });


export const getUser = (token) =>
    api.get("Auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const updateProfile = (token, payload) =>
    api.put("Auth/me", payload, {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const updateProfilePicture = (token, profilePicture) =>
    api.put(
        "Auth/me/profile-picture",
        { profilePicture },
        {
            headers: { "Authorization": `Bearer ${token}` }
        }
    );

export const updateProfilePictureFile = (token, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.put("Auth/me/profile-picture", formData, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
};

export const getProfileTheme = (token) =>
    api.get("Auth/me/theme", {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const updateProfileTheme = (token, theme) =>
    api.put(
        "Auth/me/theme",
        { theme },
        {
            headers: { "Authorization": `Bearer ${token}` }
        }
    );

export const completeTutorial = (token) =>
    api.put(
        "Auth/me/tutorial",
        { completed: true },
        {
            headers: { "Authorization": `Bearer ${token}` }
        }
    );






// Friends endpoints

export const getFriends = (token) =>
    api.get("/friend/list", {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const searchFriends = (token, query) =>
    api.get("/friend/search", {
        headers: { "Authorization": `Bearer ${token}` },
        params: { query }
    });

export const getFriendStatus = (token, targetUserId) =>
    api.get(`/friend/status/${targetUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const addFriend = (token, username) =>
    api.post("/friend/add", null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { username }
    });

export const respondFriendRequest = (token, requestId, action) =>
    api.post("/friend/respond", null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { requestId, action }
    });

export const getFriendRequests = (token) =>
    api.get("/friend/requests", {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const deleteFriend = (token, friendId) =>
    api.delete(`/friend/${friendId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const blockFriend = (token, userIdToBlock) =>
    api.post("/friend/block", null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { userIdToBlock }
    });

export const unblockFriend = (token, userIdToUnblock) =>
    api.post("/friend/unblock", null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { userIdToUnblock }
    });

export const getMutualFriends = (token, otherUserId) =>
    api.get(`/friend/mutual/${otherUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const inviteMultipleFriends = (token, userIds) =>
    api.post("/friend/invite-multiple", null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { userIds: userIds.join(",") }
    });


    





// Chat endpoints
export const getMessages = (roomId) =>
    api.get("/chat/messages", { params: { channelId: roomId } });

export const sendMessage = (roomId, content) =>
    api.post("/chat/send", content, { params: { roomId } });

export const getDmHistory = (token, friendId) =>
    api.get(`/dm/with/${friendId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });


export default api;








// PDF endpoints

// Upload PDF file
export const uploadPdf = (file, token) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/pdf/upload", formData, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
        }
    });
};

// Get PDF by ID
export const getPdf = (id, token) => {
    return api.get(`/pdf/${id}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        },
        responseType: "blob" // important for file downloads
    });
};

// Get list of PDFs (characters)
export const getPdfList = (token) => {
    return api.get("/pdf/list", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
};









// =========================
// === Spells endpoints
// =========================

// Get all spells
export const getAllSpells = () =>
    api.get("/spells");

// Get spell by index
export const getSpellByIndex = (index) =>
    api.get(`/spells/${index}`);

// Get spells by level
export const getSpellsByLevel = (level) =>
    api.get(`/spells/level/${level}`);

// Get spells by school
export const getSpellsBySchool = (schoolIndex) =>
    api.get(`/spells/school/${schoolIndex}`);

// Get spells by class
export const getSpellsByClass = (classIndex) =>
    api.get(`/spells/classes/${classIndex}`);

// Get spells by subclass
export const getSpellsBySubclass = (subclassIndex) =>
    api.get(`/spells/subclasses/${subclassIndex}`);

// Get ritual spells
export const getRitualSpells = () =>
    api.get("/spells/ritual");

// Get concentration spells
export const getConcentrationSpells = () =>
    api.get("/spells/concentration");

// Search spells by name
export const searchSpellsByName = (name) =>
    api.get("/spells/search", { params: { name } });









// =========================
// === Classes endpoints
// =========================


// ===== Classes Endpoints =====
export const getAllClasses = async () => {
    try {
        const res = await api.get("/classes");
        return res.data;
    } catch (err) {
        console.error("Failed to fetch classes:", err);
        return [];
    }
};

export const getClassByIndex = async (index) => {
    try {
        const res = await api.get(`/classes/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch class ${index}:`, err);
        return null;
    }
};









// =========================
// === Races Endpoints
// =========================

// Get all races
export const getAllRaces = async () => {
    try {
        const res = await api.get("/races");
        return res.data;
    } catch (err) {
        console.error("Failed to fetch races:", err);
        return [];
    }
};

// Get race by index
export const getRaceByIndex = async (index) => {
    try {
        const res = await api.get(`/races/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch race ${index}:`, err);
        return null;
    }
};

// Get race traits
export const getRaceTraits = async (index) => {
    try {
        const res = await api.get(`/races/${index}/traits`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch traits for race ${index}:`, err);
        return [];
    }
};

// Get race subraces
export const getRaceSubraces = async (index) => {
    try {
        const res = await api.get(`/races/${index}/subraces`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch subraces for race ${index}:`, err);
        return [];
    }
};

// Get race languages
export const getRaceLanguages = async (index) => {
    try {
        const res = await api.get(`/races/${index}/languages`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch languages for race ${index}:`, err);
        return [];
    }
};

// Get race ability bonuses
export const getRaceAbilityBonuses = async (index) => {
    try {
        const res = await api.get(`/races/${index}/ability-bonuses`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch ability bonuses for race ${index}:`, err);
        return [];
    }
};

// Search races by name
export const searchRacesByName = async (name) => {
    try {
        const res = await api.get("/races/search", { params: { name } });
        return res.data;
    } catch (err) {
        console.error(`Failed to search races with name "${name}":`, err);
        return [];
    }
};

// Get all race sizes
export const getRaceSizes = async () => {
    try {
        const res = await api.get("/races/sizes");
        return res.data;
    } catch (err) {
        console.error("Failed to fetch race sizes:", err);
        return [];
    }
};

// Get races by minimum speed
export const getRacesByMinSpeed = async (minSpeed) => {
    try {
        const res = await api.get(`/races/speed/${minSpeed}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch races with speed >= ${minSpeed}:`, err);
        return [];
    }
};









// =========================
// === Monsters Endpoints
// =========================

// Get all monsters
export const getAllMonsters = async () => {
    try {
        const res = await api.get("/monsters");
        console.log("getAllMonsters response:", res.data); // Debug
        return res.data;
    } catch (err) {
        console.error("Failed to fetch monsters:", err);
        return [];
    }
};

// Get monster by index
export const getMonsterByIndex = async (index) => {
    try {
        const res = await api.get(`/monsters/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch monster ${index}:`, err);
        return null;
    }
};

// Get monsters by size
export const getMonstersBySize = async (size) => {
    try {
        const res = await api.get(`/monsters/size/${size}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch monsters of size ${size}:`, err);
        return [];
    }
};

// Get monsters by type
export const getMonstersByType = async (type) => {
    try {
        const res = await api.get(`/monsters/type/${type}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch monsters of type ${type}:`, err);
        return [];
    }
};

// Optional: Search monsters by name
export const searchMonstersByName = async (name) => {
    try {
        const res = await api.get("/monsters/search", { params: { name } });
        return res.data;
    } catch (err) {
        console.error(`Failed to search monsters with name "${name}":`, err);
        return [];
    }
};









// =========================
// === Items (Equipment) Endpoints
// =========================

// Base route for DND 2014 items
const equipmentBase = "/2014/equipment";

// Get all items
export const getAllItems = async () => {
    try {
        const res = await api.get(equipmentBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch items:", err);
        return [];
    }
};

// Get item by index
export const getItemByIndex = async (index) => {
    try {
        const res = await api.get(`${equipmentBase}/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch item ${index}:`, err);
        return null;
    }
};

// Get all item categories
export const getItemCategories = async () => {
    try {
        const res = await api.get(`${equipmentBase}/categories`);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch item categories:", err);
        return [];
    }
};

// Get items by category
export const getItemsByCategory = async (category) => {
    try {
        const res = await api.get(`${equipmentBase}/category/${category}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch items in category ${category}:`, err);
        return [];
    }
};

// Get all weapons (optionally filter by weaponCategory)
export const getWeapons = async (weaponCategory = null) => {
    try {
        const res = await api.get(`${equipmentBase}/weapons`, {
            params: weaponCategory ? { weaponCategory } : {}
        });
        return res.data;
    } catch (err) {
        console.error("Failed to fetch weapons:", err);
        return [];
    }
};

// Get all armor (optionally filter by armorCategory)
export const getArmor = async (armorCategory = null) => {
    try {
        const res = await api.get(`${equipmentBase}/armor`, {
            params: armorCategory ? { armorCategory } : {}
        });
        return res.data;
    } catch (err) {
        console.error("Failed to fetch armor:", err);
        return [];
    }
};

// Get all gear (optionally filter by gearCategory)
export const getGear = async (gearCategory = null) => {
    try {
        const res = await api.get(`${equipmentBase}/gear`, {
            params: gearCategory ? { gearCategory } : {}
        });
        return res.data;
    } catch (err) {
        console.error("Failed to fetch gear:", err);
        return [];
    }
};

// Get all tools (optionally filter by toolCategory)
export const getTools = async (toolCategory = null) => {
    try {
        const res = await api.get(`${equipmentBase}/tools`, {
            params: toolCategory ? { toolCategory } : {}
        });
        return res.data;
    } catch (err) {
        console.error("Failed to fetch tools:", err);
        return [];
    }
};

// Get all mounts & vehicles (optionally filter by vehicleCategory)
export const getMountsAndVehicles = async (vehicleCategory = null) => {
    try {
        const res = await api.get(`${equipmentBase}/mounts-vehicles`, {
            params: vehicleCategory ? { vehicleCategory } : {}
        });
        return res.data;
    } catch (err) {
        console.error("Failed to fetch mounts and vehicles:", err);
        return [];
    }
};

// Search items by query string
export const searchItems = async (query) => {
    try {
        const res = await api.get(`${equipmentBase}/search`, { params: { q: query } });
        return res.data;
    } catch (err) {
        console.error(`Failed to search items with query "${query}":`, err);
        return [];
    }
};


// =========================
// === Weapon Properties Endpoints
// =========================
export const getWeaponProperties = async () => {
    try {
        const res = await api.get("/2014/WeaponProperties");
        return res.data;
    } catch (err) {
        console.error("Failed to fetch weapon properties:", err);
        return [];
    }
};

export const getWeaponPropertyByIndex = async (index) => {
    try {
        const res = await api.get(`/2014/WeaponProperties/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch weapon property ${index}:`, err);
        return null;
    }
};










// =========================
// === Character Endpoints
// =========================


const withAuth = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { "Authorization": `Bearer ${token}` } } : {};
};

export const CharacterApi = {
  async getAll() {
    const res = await api.get("/characters", withAuth());
    return res.data;
  },

  async get(id) {
    const res = await api.get(`/characters/${id}`, withAuth());
    return res.data;
  },

  async create(data) {
    const res = await api.post("/characters", data, withAuth());
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/characters/${id}`, data, withAuth());
    return res.data;
  },

  async remove(id) {
    const res = await api.delete(`/characters/${id}`, withAuth());
    return res.data;
  },
};

// =========================
// === VTT Endpoints
// =========================

export const VttApi = {
  async listSessions() {
    const res = await api.get("/vtt/sessions", withAuth());
    return res.data;
  },

  async createSession(name) {
    const res = await api.post("/vtt/sessions", { name }, withAuth());
    return res.data;
  },

  async joinSession(id) {
    const res = await api.post(`/vtt/sessions/${id}/join`, null, withAuth());
    return res.data;
  },

  async getState(id) {
    const res = await api.get(`/vtt/sessions/${id}/state`, withAuth());
    return res.data;
  },

  async updateMap(id, payload) {
    const res = await api.put(`/vtt/sessions/${id}/map`, payload, withAuth());
    return res.data;
  },

  async uploadMapImage(id, file) {
    const formData = new FormData();
    formData.append("file", file);
    const config = withAuth();
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "multipart/form-data"
    };
    const res = await api.post(`/vtt/sessions/${id}/map/image`, formData, config);
    return res.data;
  },

  async uploadAsset(id, file, kind = "misc") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const config = withAuth();
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "multipart/form-data"
    };
    const res = await api.post(`/vtt/sessions/${id}/assets`, formData, config);
    return res.data;
  }
};


// =========================
// === Backgrounds Endpoints
// =========================

const backgroundsBase = "/2014/backgrounds";

// Get all backgrounds
export const getAllBackgrounds = async () => {
    try {
        const res = await api.get(backgroundsBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch backgrounds:", err);
        return [];
    }
};

// Get background by index
export const getBackgroundByIndex = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch background ${index}:`, err);
        return null;
    }
};

// Get background feature by index
export const getBackgroundFeature = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}/feature`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch feature for background ${index}:`, err);
        return null;
    }
};

// Get background starting equipment by index
export const getBackgroundStartingEquipment = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}/starting-equipment`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch starting equipment for background ${index}:`, err);
        return null;
    }
};

// Get background proficiencies by index
export const getBackgroundProficiencies = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}/proficiencies`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch proficiencies for background ${index}:`, err);
        return null;
    }
};









// =========================
// === Ability Scores Endpoints
// =========================

// Get all ability scores
export const getAllAbilityScores = async () => {
    try {
        const res = await api.get('/2014/AbilityScores'); // correct endpoint for this API
        return res.data || []; // API returns full array directly
    } catch (err) {
        console.error("Failed to fetch ability scores:", err);
        return [];
    }
};









// =========================
// === Alignments Endpoints
// =========================

const alignmentsBase = "/2014/alignments";

// Get all alignments
export const getAllAlignments = async () => {
    try {
        const res = await api.get(alignmentsBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch alignments:", err);
        return [];
    }
};









// =========================
// === Conditions Endpoints
// =========================

const conditionsBase = "/Conditions";

// Get all conditions
export const getAllConditions = async () => {
    try {
        const res = await api.get(conditionsBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch conditions:", err);
        return [];
    }
};








// =========================
// === Damage Types Endpoints
// =========================

const damageTypesBase = "/2014/DamageTypes";

// Get all damage types
export const getAllDamageTypes = async () => {
    try {
        const res = await api.get(damageTypesBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch damage types:", err);
        return [];
    }
};










// =========================
// === Languages Endpoints
// =========================

const languagesBase = "/Languages";

// Get all languages
export const getAllLanguages = async () => {
    try {
        const res = await api.get(languagesBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch languages:", err);
        return [];
    }
};

// Get language by index
export const getLanguageByIndex = async (index) => {
    try {
        const res = await api.get(`${languagesBase}/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch language with index "${index}":`, err);
        return null;
    }
};

// Get languages by type (Standard, Exotic)
export const getLanguagesByType = async (type) => {
    try {
        const res = await api.get(`${languagesBase}/type/${type}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch languages of type "${type}":`, err);
        return [];
    }
};

// Get languages by script
export const getLanguagesByScript = async (script) => {
    try {
        const res = await api.get(`${languagesBase}/script/${script}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch languages with script "${script}":`, err);
        return [];
    }
};

// Optional: search languages by name or index (client-side)
export const searchLanguages = async (query) => {
    try {
        const all = await getAllLanguages();
        const q = query.toLowerCase();
        return all.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.index.toLowerCase().includes(q)
        );
    } catch (err) {
        console.error(`Failed to search languages with query "${query}":`, err);
        return [];
    }
};







// =========================
// === Magic Items Endpoints
// =========================

// Get all magic items
export const getAllMagicItems = () =>
  api.get("/MagicItems");

// Get magic item by index
export const getMagicItemByIndex = (index) =>
  api.get(`/MagicItems/${encodeURIComponent(index)}`);

// Get magic items by category
export const getMagicItemsByCategory = (category) =>
  api.get(`/MagicItems/category/${encodeURIComponent(category)}`);

// Get magic items by rarity
export const getMagicItemsByRarity = (rarity) =>
  api.get(`/MagicItems/rarity/${encodeURIComponent(rarity)}`);

// Search magic items by name (querystring)
export const searchMagicItemsByName = (name) =>
  api.get("/MagicItems/search", { params: { name } });

// Get variants for an item
export const getMagicItemVariants = (index) =>
  api.get(`/MagicItems/${encodeURIComponent(index)}/variants`);

// Items requiring attunement
export const getMagicItemsAttunementRequired = () =>
  api.get("/MagicItems/attunement/required");

// Cursed items
export const getCursedMagicItems = () =>
  api.get("/MagicItems/cursed");

// All available equipment category names
export const getMagicItemCategories = () =>
  api.get("/MagicItems/categories");

// All available rarity names
export const getMagicItemRarities = () =>
  api.get("/MagicItems/rarities");

// Paginated list
export const getPaginatedMagicItems = (page = 1, pageSize = 20) =>
  api.get("/MagicItems/paginated", { params: { page, pageSize } });











// =========================
// === Magic Schools Endpoints
// =========================

// Get all magic schools
export const getAllMagicSchools = () =>
  api.get("/MagicSchools");

// Get magic school by index
export const getMagicSchoolByIndex = (index) =>
  api.get(`/MagicSchools/${encodeURIComponent(index)}`);







// =========================
// === Proficiencies Endpoints
// =========================

// Get all proficiencies
export const getAllProficiencies = () =>
  api.get("/Proficiencies");

// Get proficiency by index
export const getProficiencyByIndex = (index) =>
  api.get(`/Proficiencies/${encodeURIComponent(index)}`);

// Get proficiencies by type
export const getProficienciesByType = (type) =>
  api.get(`/Proficiencies/type/${encodeURIComponent(type)}`);

// Get proficiencies by class index
export const getProficienciesByClass = (classIndex) =>
  api.get(`/Proficiencies/class/${encodeURIComponent(classIndex)}`);

// Get proficiencies by race index
export const getProficienciesByRace = (raceIndex) =>
  api.get(`/Proficiencies/race/${encodeURIComponent(raceIndex)}`);

// Search proficiencies by name
export const searchProficienciesByName = (name) =>
  api.get("/Proficiencies/search", { params: { name } });

// Get proficiency categories (distinct types)
export const getProficiencyCategories = () =>
  api.get("/Proficiencies/categories");





// =========================
// === Skills Endpoints
// =========================

// Get all skills
export const getAllSkills = () =>
  api.get("/Skills");

// Get skill by index
export const getSkillByIndex = (index) =>
  api.get(`/Skills/${encodeURIComponent(index)}`);

// Get skills by ability index (e.g., str, dex, con, int, wis, cha)
export const getSkillsByAbility = (abilityIndex) =>
  api.get(`/Skills/ability/${encodeURIComponent(abilityIndex)}`);

// Search skills by name
export const searchSkillsByName = (name) =>
  api.get("/Skills/search", { params: { name } });

// Search skills by description keyword
export const searchSkillsByDescription = (keyword) =>
  api.get("/Skills/search/description", { params: { keyword } });

// Get distinct ability score names (e.g., STR, DEX, ...)
export const getSkillAbilityScores = () =>
  api.get("/Skills/ability-scores");

// Grouped by ability name
export const getSkillsGroupedByAbility = () =>
  api.get("/Skills/grouped-by-ability");

// Convenience buckets
export const getPhysicalSkills = () =>
  api.get("/Skills/physical");

export const getMentalSkills = () =>
  api.get("/Skills/mental");

export const getSocialSkills = () =>
  api.get("/Skills/social");

// Per-skill helpers
export const getSkillExamples = (index) =>
  api.get(`/Skills/${encodeURIComponent(index)}/examples`);

export const getSkillFullDescription = (index) =>
  api.get(`/Skills/${encodeURIComponent(index)}/full-description`);

// Summary endpoints
export const getSkillsCount = () =>
  api.get("/Skills/count");

export const getSkillsSummary = () =>
  api.get("/Skills/summary");






// =========================
// === Subclasses Endpoints
// =========================

// Get all subclasses
export const getAllSubclasses = () =>
  api.get("/Subclasses");

// Get subclass by index
export const getSubclassByIndex = (index) =>
  api.get(`/Subclasses/${encodeURIComponent(index)}`);

// Get subclasses by class name (e.g., "Bard", "Cleric")
export const getSubclassesByClassName = (className) =>
  api.get(`/Subclasses/class/${encodeURIComponent(className)}`);




// =========================
// === Subraces Endpoints
// =========================

// Get all subraces
export const getAllSubraces = () =>
  api.get("/Subraces");

// Get subrace by index
export const getSubraceByIndex = (index) =>
  api.get(`/Subraces/${encodeURIComponent(index)}`);

// Get subraces by race name (e.g., "Elf", "Dwarf")
export const getSubracesByRaceName = (raceName) =>
  api.get(`/Subraces/race/${encodeURIComponent(raceName)}`);

// Search subraces by name
export const searchSubraces = (name) =>
  api.get(`/Subraces/search/${encodeURIComponent(name)}`);

// Helper endpoints
export const getSubraceTotalBonuses = (index) =>
  api.get(`/Subraces/${encodeURIComponent(index)}/total-bonuses`);

export const getSubraceTraits = (index) =>
  api.get(`/Subraces/${encodeURIComponent(index)}/traits`);
