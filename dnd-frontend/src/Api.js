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
