import axios from "axios";

const api = axios.create({
    baseURL: "http://212.48.254.1:5000/api/",
    headers: {
        "Content-Type": "application/json"
    }
});






// Auth endpoints
export const register = (email, username, password) =>
    api.post("/auth/register", null, {
        params: { email, username, password }
    });

export const login = (email, password) =>
    api.post("/auth/login", null, {
        params: { email, password },
        headers: { "Content-Type": "application/json" }
    });

export const getUser = async (token) =>
    api.get("/auth/me", {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "/"
        }
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
