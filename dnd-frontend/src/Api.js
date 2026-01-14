import axios from "axios";

const api = axios.create({
    baseURL: "https://api.dnd-tool.com/api",
    headers: {
        "Content-Type": "application/json"
    }
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

export const getOnlineFriends = (token) =>
    api.get("/friend/online", {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const getFriendNotifications = (token) =>
    api.get("/friend/notifications", {
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






// Community endpoints

export const getCommunities = (token) =>
    api.get("/community", {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getCommunity = (id, token) =>
    api.get(`/community/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const createCommunity = (data, token) =>
    api.post("/community", data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

export const updateCommunity = (id, data, token) =>
    api.put(`/community/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

export const deleteCommunity = (id, token) =>
    api.delete(`/community/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });






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


export const CharacterApi = {
  async getAll() {
    const res = await api.get("/character");
    return res.data;
  },

  async get(id) {
    const res = await api.get(`/character/${id}`);
    return res.data;
  },

  async create(data) {
    const res = await api.post("/character", data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/character/${id}`, data);
    return res.data;
  },

  async remove(id) {
    const res = await api.delete(`/character/${id}`);
    return res.data;
  },
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