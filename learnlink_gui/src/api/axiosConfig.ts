import axios from "axios";

const api = axios.create({
    baseURL: "https://learnlink-v1-env.eba-b28u347j.eu-north-1.elasticbeanstalk.com",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            // Clean token and add to headers
            const cleanToken = token.replace(/['"]+/g, '');
            config.headers.Authorization = `Bearer ${cleanToken}`;
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
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
