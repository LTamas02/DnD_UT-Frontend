import axios from "axios";
import api, { API_BASE as CORE_API_BASE } from "../../Api";

export const API_BASE = CORE_API_BASE;

const apiSilent = axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
        "Content-Type": "application/json"
    }
});

const dndCache = {
    markdownBooks: null,
    markdownBooksPromise: null,
    monsters: null,
    monstersPromise: null
};

// =========================
// === Books (markdown) endpoints
// =========================

export const getMarkdownBooks = () => {
    if (dndCache.markdownBooks) {
        return Promise.resolve({ data: dndCache.markdownBooks });
    }
    if (dndCache.markdownBooksPromise) {
        return dndCache.markdownBooksPromise;
    }
    dndCache.markdownBooksPromise = api
        .get("/books/markdown")
        .then((res) => {
            dndCache.markdownBooks = res.data;
            return res;
        })
        .finally(() => {
            dndCache.markdownBooksPromise = null;
        });
    return dndCache.markdownBooksPromise;
};

export const getMarkdownBookContent = (fileName) =>
    api.get(`/books/markdown/${encodeURIComponent(fileName)}`, {
        responseType: "text"
    });

export const getMarkdownBookContentSilent = (fileName, config = {}) =>
    apiSilent.get(`/books/markdown/${encodeURIComponent(fileName)}`, {
        responseType: "text",
        ...config
    });

// =========================
// === Auth endpoints
// =========================

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

// =========================
// === Profile endpoints
// =========================

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

// =========================
// === Friends endpoints
// =========================

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

export const getBlockedUsers = async (token) => {
    const headers = { "Authorization": `Bearer ${token}` };
    const candidates = [
        "/friend/blocked",
        "/friend/blocked-users",
        "/friend/blocked/list"
    ];

    let lastError = null;
    for (const endpoint of candidates) {
        try {
            const res = await api.get(endpoint, { headers });
            if (Array.isArray(res?.data)) {
                return res.data;
            }
            if (Array.isArray(res?.data?.data)) {
                return res.data.data;
            }
            return [];
        } catch (err) {
            lastError = err;
        }
    }

    try {
        const res = await api.get("/friend/list", { headers });
        const list = Array.isArray(res?.data) ? res.data : [];
        return list.filter((u) => !!(u?.blocked ?? u?.isBlocked));
    } catch {
        // ignore fallback errors and throw the original endpoint failure below
    }

    throw lastError || new Error("Failed to load blocked users.");
};

export const getMutualFriends = (token, otherUserId) =>
    api.get(`/friend/mutual/${otherUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

export const inviteMultipleFriends = (token, userIds) =>
    api.post("/friend/invite-multiple", null, {
        headers: { "Authorization": `Bearer ${token}` },
        params: { userIds: userIds.join(",") }
    });

export const getDmHistory = (token, friendId) =>
    api.get(`/dm/with/${friendId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

// =========================
// === PDF endpoints
// =========================

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

export const getPdf = (id, token) => {
    return api.get(`/pdf/${id}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        },
        responseType: "blob"
    });
};

export const getPdfList = (token) => {
    return api.get("/pdf/list", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
};

// =========================
// === Character endpoints
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
    }
};

// =========================
// === Spells endpoints
// =========================

export const getAllSpells = () =>
    api.get("/spells");

export const getSpellByIndex = (index) =>
    api.get(`/spells/${index}`);

export const getSpellsByLevel = (level) =>
    api.get(`/spells/level/${level}`);

export const getSpellsBySchool = (schoolIndex) =>
    api.get(`/spells/school/${schoolIndex}`);

export const getSpellsByClass = (classIndex) =>
    api.get(`/spells/classes/${classIndex}`);

export const getSpellsBySubclass = (subclassIndex) =>
    api.get(`/spells/subclasses/${subclassIndex}`);

export const getRitualSpells = () =>
    api.get("/spells/ritual");

export const getConcentrationSpells = () =>
    api.get("/spells/concentration");

export const searchSpellsByName = (name) =>
    api.get("/spells/search", { params: { name } });

// =========================
// === Classes endpoints
// =========================

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
// === Races endpoints
// =========================

export const getAllRaces = async () => {
    try {
        const res = await api.get("/races");
        return res.data;
    } catch (err) {
        console.error("Failed to fetch races:", err);
        return [];
    }
};

export const getRaceByIndex = async (index) => {
    try {
        const res = await api.get(`/races/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch race ${index}:`, err);
        return null;
    }
};

export const getRaceTraits = async (index) => {
    try {
        const res = await api.get(`/races/${index}/traits`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch traits for race ${index}:`, err);
        return [];
    }
};

export const getRaceSubraces = async (index) => {
    try {
        const res = await api.get(`/races/${index}/subraces`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch subraces for race ${index}:`, err);
        return [];
    }
};

export const getRaceLanguages = async (index) => {
    try {
        const res = await api.get(`/races/${index}/languages`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch languages for race ${index}:`, err);
        return [];
    }
};

export const getRaceAbilityBonuses = async (index) => {
    try {
        const res = await api.get(`/races/${index}/ability-bonuses`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch ability bonuses for race ${index}:`, err);
        return [];
    }
};

export const searchRacesByName = async (name) => {
    try {
        const res = await api.get("/races/search", { params: { name } });
        return res.data;
    } catch (err) {
        console.error(`Failed to search races with name "${name}":`, err);
        return [];
    }
};

export const getRaceSizes = async () => {
    try {
        const res = await api.get("/races/sizes");
        return res.data;
    } catch (err) {
        console.error("Failed to fetch race sizes:", err);
        return [];
    }
};

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
// === Monsters endpoints
// =========================

export const getAllMonsters = async () => {
    if (dndCache.monsters) {
        return dndCache.monsters;
    }
    if (dndCache.monstersPromise) {
        return dndCache.monstersPromise;
    }
    dndCache.monstersPromise = api
        .get("/monsters")
        .then((res) => {
            dndCache.monsters = res.data;
            return res.data;
        })
        .catch((err) => {
            console.error("Failed to fetch monsters:", err);
            return [];
        })
        .finally(() => {
            dndCache.monstersPromise = null;
        });
    return dndCache.monstersPromise;
};

export const getMonsterByIndex = async (index) => {
    try {
        const res = await api.get(`/monsters/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch monster ${index}:`, err);
        return null;
    }
};

export const getMonstersBySize = async (size) => {
    try {
        const res = await api.get(`/monsters/size/${size}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch monsters of size ${size}:`, err);
        return [];
    }
};

export const getMonstersByType = async (type) => {
    try {
        const res = await api.get(`/monsters/type/${type}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch monsters of type ${type}:`, err);
        return [];
    }
};

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
// === Items (Equipment) endpoints
// =========================

const equipmentBase = "/2014/equipment";

export const getAllItems = async () => {
    try {
        const res = await api.get(equipmentBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch items:", err);
        return [];
    }
};

export const getItemByIndex = async (index) => {
    try {
        const res = await api.get(`${equipmentBase}/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch item ${index}:`, err);
        return null;
    }
};

export const getItemCategories = async () => {
    try {
        const res = await api.get(`${equipmentBase}/categories`);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch item categories:", err);
        return [];
    }
};

export const getItemsByCategory = async (category) => {
    try {
        const res = await api.get(`${equipmentBase}/category/${category}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch items in category ${category}:`, err);
        return [];
    }
};

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
// === Weapon Properties endpoints
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
// === Backgrounds endpoints
// =========================

const backgroundsBase = "/2014/backgrounds";

export const getAllBackgrounds = async () => {
    try {
        const res = await api.get(backgroundsBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch backgrounds:", err);
        return [];
    }
};

export const getBackgroundByIndex = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch background ${index}:`, err);
        return null;
    }
};

export const getBackgroundFeature = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}/feature`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch feature for background ${index}:`, err);
        return null;
    }
};

export const getBackgroundStartingEquipment = async (index) => {
    try {
        const res = await api.get(`${backgroundsBase}/${index}/starting-equipment`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch starting equipment for background ${index}:`, err);
        return null;
    }
};

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
// === Ability Scores endpoints
// =========================

export const getAllAbilityScores = async () => {
    try {
        const res = await api.get("/2014/AbilityScores");
        return res.data || [];
    } catch (err) {
        console.error("Failed to fetch ability scores:", err);
        return [];
    }
};

// =========================
// === Alignments endpoints
// =========================

const alignmentsBase = "/2014/alignments";

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
// === Conditions endpoints
// =========================

const conditionsBase = "/Conditions";

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
// === Damage Types endpoints
// =========================

const damageTypesBase = "/2014/DamageTypes";

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
// === Languages endpoints
// =========================

const languagesBase = "/Languages";

export const getAllLanguages = async () => {
    try {
        const res = await api.get(languagesBase);
        return res.data;
    } catch (err) {
        console.error("Failed to fetch languages:", err);
        return [];
    }
};

export const getLanguageByIndex = async (index) => {
    try {
        const res = await api.get(`${languagesBase}/${index}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch language with index "${index}":`, err);
        return null;
    }
};

export const getLanguagesByType = async (type) => {
    try {
        const res = await api.get(`${languagesBase}/type/${type}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch languages of type "${type}":`, err);
        return [];
    }
};

export const getLanguagesByScript = async (script) => {
    try {
        const res = await api.get(`${languagesBase}/script/${script}`);
        return res.data;
    } catch (err) {
        console.error(`Failed to fetch languages with script "${script}":`, err);
        return [];
    }
};

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
// === Magic Items endpoints
// =========================

export const getAllMagicItems = () =>
  api.get("/MagicItems");

export const getMagicItemByIndex = (index) =>
  api.get(`/MagicItems/${encodeURIComponent(index)}`);

export const getMagicItemsByCategory = (category) =>
  api.get(`/MagicItems/category/${encodeURIComponent(category)}`);

export const getMagicItemsByRarity = (rarity) =>
  api.get(`/MagicItems/rarity/${encodeURIComponent(rarity)}`);

export const searchMagicItemsByName = (name) =>
  api.get("/MagicItems/search", { params: { name } });

export const getMagicItemVariants = (index) =>
  api.get(`/MagicItems/${encodeURIComponent(index)}/variants`);

export const getMagicItemsAttunementRequired = () =>
  api.get("/MagicItems/attunement/required");

export const getCursedMagicItems = () =>
  api.get("/MagicItems/cursed");

export const getMagicItemCategories = () =>
  api.get("/MagicItems/categories");

export const getMagicItemRarities = () =>
  api.get("/MagicItems/rarities");

export const getPaginatedMagicItems = (page = 1, pageSize = 20) =>
  api.get("/MagicItems/paginated", { params: { page, pageSize } });

// =========================
// === Magic Schools endpoints
// =========================

export const getAllMagicSchools = () =>
  api.get("/MagicSchools");

export const getMagicSchoolByIndex = (index) =>
  api.get(`/MagicSchools/${encodeURIComponent(index)}`);

// =========================
// === Proficiencies endpoints
// =========================

export const getAllProficiencies = () =>
  api.get("/Proficiencies");

export const getProficiencyByIndex = (index) =>
  api.get(`/Proficiencies/${encodeURIComponent(index)}`);

export const getProficienciesByType = (type) =>
  api.get(`/Proficiencies/type/${encodeURIComponent(type)}`);

export const getProficienciesByClass = (classIndex) =>
  api.get(`/Proficiencies/class/${encodeURIComponent(classIndex)}`);

export const getProficienciesByRace = (raceIndex) =>
  api.get(`/Proficiencies/race/${encodeURIComponent(raceIndex)}`);

export const searchProficienciesByName = (name) =>
  api.get("/Proficiencies/search", { params: { name } });

export const getProficiencyCategories = () =>
  api.get("/Proficiencies/categories");

// =========================
// === Skills endpoints
// =========================

export const getAllSkills = () =>
  api.get("/Skills");

export const getSkillByIndex = (index) =>
  api.get(`/Skills/${encodeURIComponent(index)}`);

export const getSkillsByAbility = (abilityIndex) =>
  api.get(`/Skills/ability/${encodeURIComponent(abilityIndex)}`);

export const searchSkillsByName = (name) =>
  api.get("/Skills/search", { params: { name } });

export const searchSkillsByDescription = (keyword) =>
  api.get("/Skills/search/description", { params: { keyword } });

export const getSkillAbilityScores = () =>
  api.get("/Skills/ability-scores");

export const getSkillsGroupedByAbility = () =>
  api.get("/Skills/grouped-by-ability");

export const getPhysicalSkills = () =>
  api.get("/Skills/physical");

export const getMentalSkills = () =>
  api.get("/Skills/mental");

export const getSocialSkills = () =>
  api.get("/Skills/social");

export const getSkillExamples = (index) =>
  api.get(`/Skills/${encodeURIComponent(index)}/examples`);

export const getSkillFullDescription = (index) =>
  api.get(`/Skills/${encodeURIComponent(index)}/full-description`);

export const getSkillsCount = () =>
  api.get("/Skills/count");

export const getSkillsSummary = () =>
  api.get("/Skills/summary");

// =========================
// === Subclasses endpoints
// =========================

export const getAllSubclasses = () =>
  api.get("/Subclasses");

export const getSubclassByIndex = (index) =>
  api.get(`/Subclasses/${encodeURIComponent(index)}`);

export const getSubclassesByClassName = (className) =>
  api.get(`/Subclasses/class/${encodeURIComponent(className)}`);

// =========================
// === Subraces endpoints
// =========================

export const getAllSubraces = () =>
  api.get("/Subraces");

export const getSubraceByIndex = (index) =>
  api.get(`/Subraces/${encodeURIComponent(index)}`);

export const getSubracesByRaceName = (raceName) =>
  api.get(`/Subraces/race/${encodeURIComponent(raceName)}`);

export const searchSubraces = (name) =>
  api.get(`/Subraces/search/${encodeURIComponent(name)}`);

export const getSubraceTotalBonuses = (index) =>
  api.get(`/Subraces/${encodeURIComponent(index)}/total-bonuses`);

export const getSubraceTraits = (index) =>
  api.get(`/Subraces/${encodeURIComponent(index)}/traits`);
