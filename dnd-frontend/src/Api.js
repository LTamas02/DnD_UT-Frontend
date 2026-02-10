import axios from "axios";
import { startLoading, stopLoading } from "./loadingStore";

export const API_BASE = "https://api.dnd-tool.com";
//export const API_BASE = "http://localhost:5000";

const api = axios.create({
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

export default api;
