import api from "../../../api/axiosConfig"; // Ensure correct path to axiosConfig

/**
 * Login function to authenticate user
 * @param username - User's username
 * @param password - User's password
 * @returns The response data from the server
 */
export const login = async (username: string, password: string) => {
    try {
        const response = await api.post("/login", { username, password });
        return response.data; // Adjust based on the API's response structure
    } catch (error: any) {
        console.error("Login error:", error);
        throw error.response?.data?.message || "Login failed. Please try again.";
    }
};
