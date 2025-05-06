import axios from "axios";
import API_BASE_URL from "./apiConfig";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // Temporarily disable withCredentials for local development
    withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            // Clean token and add to headers
            const cleanToken = token.replace(/['"]+/g, '');
            config.headers.Authorization = `Bearer ${cleanToken}`;

        } else {

        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth data
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/') {
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
