// Api.js
import axios from "axios";

const api = axios.create({
    baseURL: "http://212.48.254.1:5000/api/",
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor to add Authorization header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth endpoints
export const register = (email, username, password) =>
    api.post("/auth/register", null, {
        params: { email, username, password }
    });

export const login = (email, password) =>
    api.post("/auth/login", null, {
        params: { email, password }
    });

export const getUser = () => api.get("/auth/me"); // token auto-included

export default api;
