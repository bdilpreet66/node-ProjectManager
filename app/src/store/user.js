import { executeSql, initializeDB } from './storage';
import { getUserData } from './creds';

export const createUser = async (email, password, type, hourly_rate, created_by) => {
    try {
        await executeSql('INSERT INTO Users (email, password, type, hourly_rate, created_by) VALUES (?, ?, ?, ?, ?)', [email, password, type, hourly_rate, created_by]);
    } catch (error) {
        console.error("Error creating user: ", error);
        throw error;
    }
};

export const updateHours = async (email, hourly_rate) => {
    try {
        await executeSql('UPDATE Users SET hourly_rate = ? WHERE email = ?', [hourly_rate, email]);
    } catch (error) {
        console.error("Error updating user: ", error);
        throw error;
    }
};

export const updatePassword = async (email, password) => {
    try {
        await executeSql('UPDATE Users SET password = ? WHERE email = ?', [password, email]);
    } catch (error) {
        console.error("Error updating user: ", error);
        throw error;
    }
};

export const deleteUser = async (email) => {
    try {
        await executeSql('DELETE FROM Users WHERE email = ?', [email]);
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw error;
    }
};

export const listUsers = async (page, searchText) => {
    try {
      const offset = (page - 1) * 10; // Assuming each page shows 10 users
      const limit = 10; // Number of users to fetch per page
  
      let query = 'SELECT * FROM Users';
      let params = [];

      user = await getUserData();
  
      if (searchText) {
        query += ` WHERE created_by = '${user.email}' AND Lower(email) LIKE '%${searchText.toLowerCase()}%'`; // Assuming you want to search by email
      } else {
        query += ` WHERE email = '${user.email}' OR created_by = '${user.email}'`
      }
  
      query += ' ORDER BY email DESC'; // Assuming you want to order by the user ID in descending order
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      console.log(query)
      const results = await executeSql(query, params); // Execute the SQL query with parameters
      console.log(results)
  
      // Format the results as needed, assuming each result row is an object with properties matching the table columns
      const users = results.map((row) => ({
        email: row.email,
        hourly_rate: row.hourly_rate,
        type: row.type,
        created_by: row.created_by,
      }));
  
      return users;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
};

export const getAvailableUser = async () => {
    try {

      user = await getUserData();
  
      let query = `SELECT * FROM Users WHERE created_by = '${user.email}' OR email = '${user.email}'`;

      const results = await executeSql(query, []); // Execute the SQL query with parameters
  
      // Format the results as needed, assuming each result row is an object with properties matching the table columns
      const users = results.map((row) => ({
        email: row.email,
        hourly_rate: row.hourly_rate,
        type: row.type,
        created_by: row.created_by,
      }));
  
      return users;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
};

export const searchUsers = async (email) => {
    try {
        const users = await executeSql('SELECT * FROM Users WHERE email = ?', [email]);
        return users;
    } catch (error) {
        console.error("Error searching users: ", error);
        throw error;
    }
};

export const validateLogin = async (email, password) => {
    try {
      const users = await searchUsers(email);
  
      if (users.length > 0) {
        const user = users[0];
  
        if (user.password === password) {
          return { success: true, data: user, message: 'User login successful.' };
        } else {
          return { success: false, data: '', message: 'Incorrect password.' };
        }
      } else {
        return { success: false, data: '', message: 'User not found.' };
      }
    } catch (error) {
      console.error('Error validating login:', error);
      throw error;
    }
};

export const initializeUsers = async () => {
    try {
        await initializeDB();
    } catch (error) {
        console.error("Error initializing users: ", error);
        throw error;
    }
};
