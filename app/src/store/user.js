import axios from 'axios';

// Assuming your Express server is running on localhost port 3000
const API_URL = 'http://localhost:3000';

export const createUser = async (email, password, type, hourly_rate, created_by) => {
    try {
        const response = await axios.post(`${API_URL}/users`, {
            email,
            password,
            type,
            hourly_rate,
            created_by
        });
        return response.data;
    } catch (error) {
        console.error("Error creating user: ", error);
        throw error;
    }
};

export const updateHours = async (email, hourly_rate) => {
    try {
        const response = await axios.put(`${API_URL}/users/${email}/hours`, { hourly_rate });
        return response.data;
    } catch (error) {
        console.error("Error updating user: ", error);
        throw error;
    }
};

export const updatePassword = async (email, password) => {
    try {
        const response = await axios.put(`${API_URL}/users/${email}/password`, { password });
        return response.data;
    } catch (error) {
        console.error("Error updating user: ", error);
        throw error;
    }
};

export const deleteUser = async (email) => {
    try {
        const response = await axios.delete(`${API_URL}/users/${email}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw error;
    }
};

export const listUsers = async (page) => {
    try {
        const response = await axios.get(`${API_URL}/users`, { params: { page } });
        return response.data;
    } catch (error) {
        console.error('Error listing users:', error);
        throw error;
    }
};

export const searchUsers = async (email) => {
    try {
        const response = await axios.get(`${API_URL}/users/${email}`);
        return response.data;
    } catch (error) {
        console.error("Error searching users: ", error);
        throw error;
    }
};

export const validateLogin = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/users/validate`, { email, password });
        return response.data;
    } catch (error) {
        console.error('Error validating login:', error);
        throw error;
    }
};
