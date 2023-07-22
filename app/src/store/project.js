import { getUserData } from './creds';

import axios from 'axios';

const api = axios.create({ baseURL: 'http://192.168.0.70:3000' });

export const listProjects = async (page, searchText) => {
    try {
        const response = await api.get('/projects', { params: { page, searchText } });
        return response.data;
    } catch (error) {
        console.error('Error listing projects:', error);
        throw error;
    }
};

export const addProject = async (name, description) => {
    try {
        const response = await api.post('/projects', { name, description });
        return response.data;
    } catch (error) {
        console.error('Error adding project:', error);
        throw error;
    }
};

export const updateProjectByID = async (id, { name, description }) => {
    try {
        const response = await api.put(`/projects/${id}`, { name, description });
        return response.data;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};


export const createTask = async (task) => {
    try {
        const response = await api.post('/tasks', task);
        return response.data;
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};

export const getAvailableTasks = async (projectId, currentTaskId) => {
    try {
        const response = await api.get(`/tasks/available/${projectId}/${currentTaskId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting available tasks:', error);
        throw error;
    }
};

export const updateTask = async (task) => {
    try {
        const response = await api.put(`/tasks/${task.id}`, task);
        return response.data;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const updateTaskStatus = async (id, status, project) => {
    try {
        const response = await api.put(`/tasks/${id}/status`, { status, project });
        return response.data;
    } catch (error) {
        console.error('Error updating task status:', error);
        throw error;
    }
};

export const getTasksByProject = async (projectId) => {
    try {
        const response = await api.get(`/tasks/project/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting tasks by project:', error);
        throw error;
    }
};

// Function to get work history by project id
export async function getWorkHistoryByProjectId(projectId) {
    try {
        const response = await axios.get(`/tasks/work-history/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting work history by project:', error);
    }
}

// Function to create a prerequisite
export async function createPrerequisite(data) {
    try {
        const response = await axios.post('/prerequisites', data);
        return response.data;
    } catch (error) {
        console.error('Error creating prerequisite:', error);
    }
}

// Function to list prerequisites for a task
export async function listPrerequisites(taskId) {
    try {
        const response = await axios.get(`/tasks/${taskId}/prerequisites`);
        return response.data;
    } catch (error) {
        console.error('Error listing prerequisites:', error);
    }
}

// Function to list incomplete prerequisites for a task
export async function listIncompletePrerequisites(taskId) {
    try {
        const response = await axios.get(`/tasks/${taskId}/prerequisites/incomplete`);
        return response.data;
    } catch (error) {
        console.error('Error listing incomplete prerequisites:', error);
    }
}




export const deletePrerequisite = async (taskId, prerequisiteTaskId) => {
    try {
        const response = await axios.delete(`/prerequisites/${taskId}/${prerequisiteTaskId}`);
        console.log(response.data.message);
    } catch (error) {
        console.error('Error deleting prerequisite:', error);
    }
};


export const getTaskComments = async (taskId) => {
    try {
        const response = await axios.get(`/taskComments/${taskId}`);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching task comments:', error);
    }
};

export const addTaskComment = async (comment, taskId, userEmail) => {
    try {
        const response = await axios.post(`/taskComments`, { task_id: taskId, comment, commented_by: userEmail });
        console.log(response.data.message);
    } catch (error) {
        console.error('Error inserting task comment:', error);
    }
};



export const listWorkHours = async (taskId) => {
    try {
        const response = await axios.get(`/workHours/${taskId}`);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching work hours:', error);
    }
};



export const getTasksByMember = async (memberEmail) => {
    try {
        const response = await axios.get(`/tasks/byMember/${memberEmail}`);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching tasks by member:', error);
    }
};


export const createWorkedHour = async (workedHour, email) => {
    try {
        const response = await axios.post(`/workHours`, { ...workedHour, email });
        console.log(response.data.message);
    } catch (error) {
        console.error('Error creating worked hour:', error);
    }
};


export const calculateWorkedHour = async (taskId) => {
    try {
        const response = await axios.get(`/workHours/totalCost/${taskId}`);
        return response.data.totalCost;
    } catch (error) {
        console.error('Error calculating total worked hours cost:', error);
        return 0.00;
    }
};


export const getProjectTotalCost = async (projectId) => {
    try {
        const response = await axios.get(`/projects/totalCost/${projectId}`);
        return response.data.totalCost;
    } catch (error) {
        console.error('Error getting project total cost:', error);
        return 0.00;
    }
};


export const approveWorkHour = async (workHourId) => {
    try {
        const response = await axios.patch(`/workHours/approve/${workHourId}`);
        console.log(response.data.message);
    } catch (error) {
        console.error('Error approving work hour:', error);
    }
};

export const disapproveWorkHour = async (workHourId) => {
    try {
        const response = await axios.patch(`/workHours/disapprove/${workHourId}`);
        console.log(response.data.message);
    } catch (error) {
        console.error('Error disapproving work hour:', error);
    }
};



export const getProjectProgress = async () => {
    try {
        const response = await axios.get('/projects/getProjectProgress');
        return response.data;
    } catch (error) {
        console.error('Error getting project progress:', error);
        return [];
    }
};


export const getInprogressOverdueTasks = async () => {
    try {
        const response = await axios.get('/projects/getInprogressOverdueTasks');
        return response.data;
    } catch (error) {
        console.error('Error getting in-progress and overdue tasks:', error);
        return [];
    }
};


export const getProjectSummary = async () => {
    try {
        const response = await axios.get('/projects/getProjectSummary');
        return response.data;
    } catch (error) {
        console.error('Error getting project summary:', error);
        return {};
    }
};


export const getProjectSummaryByMember = async () => {
    try {
        const response = await axios.get('/projects/getProjectSummaryByMember');
        return response.data;
    } catch (error) {
        console.error('Error getting member summary:', error);
        return {};
    }
};


export const getProjectDetails = async (projectId) => {
    try {
        const response = await axios.get(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error(`Error getting project details for ID ${projectId}:`, error);
        return {};
    }
};
