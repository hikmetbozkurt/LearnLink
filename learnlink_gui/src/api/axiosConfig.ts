import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5001",
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
            console.log('Request with token:', { url: config.url, method: config.method });
        } else {
            console.log('Request without token:', { url: config.url, method: config.method });
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
            console.log('Unauthorized request, clearing auth data');
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
