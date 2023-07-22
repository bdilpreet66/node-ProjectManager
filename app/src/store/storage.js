import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('projectManagerDBv1_2.db');

export const executeSql = async (sql, params = []) => {
    return new Promise((resolve, reject) =>
        db.transaction(tx => {
            tx.executeSql(sql, params, (_, { rows }) => {
                resolve(rows._array)
            }, reject);
        })
    );
};

export const initializeDB = async () => {
    // User table already exists
    await executeSql(`CREATE TABLE IF NOT EXISTS Users (
        email TEXT PRIMARY KEY NOT NULL,
        password TEXT NOT NULL,
        type TEXT NOT NULL,
        hourly_rate FLOAT NOT NULL,
        created_by TEXT DEFAULT ''
    )`);

    // Project Table
    await executeSql(`CREATE TABLE IF NOT EXISTS Projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        total_cost FLOAT DEFAULT 0,
        status TEXT DEFAULT 'pending',
        completion_date TEXT DEFAULT '',
        created_by TEXT,
        FOREIGN KEY (created_by) REFERENCES Users (email) ON DELETE SET NULL
    )`);

    // Tasks Table
    await executeSql(`CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        assigned_to TEXT,
        is_active INTEGER DEFAULT 1,
        status TEXT,
        project_id INTEGER,
        FOREIGN KEY (assigned_to) REFERENCES Users (email) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES Projects (id) ON DELETE CASCADE
    )`);

    // Work Hours Table
    await executeSql(`CREATE TABLE IF NOT EXISTS WorkHours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hours INTEGER NOT NULL,
        minutes INTEGER NOT NULL,
        recorded_date TEXT NOT NULL,
        approved INTEGER DEFAULT 0,
        task_id INTEGER,
        recorded_by TEXT,
        FOREIGN KEY (task_id) REFERENCES Tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES Users (email) ON DELETE SET NULL
    )`);

    // Prerequisites Table
    await executeSql(`CREATE TABLE IF NOT EXISTS Prerequisites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        prerequisite_task_id INTEGER,
        FOREIGN KEY (task_id) REFERENCES Tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (prerequisite_task_id) REFERENCES Tasks (id) ON DELETE CASCADE
    )`);
    
    // Task Comments Table
    await executeSql(`CREATE TABLE IF NOT EXISTS TaskComments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER,
        comment TEXT NOT NULL,
        comment_date TEXT DEFAULT CURRENT_DATE,
        commented_by TEXT,
        FOREIGN KEY (task_id) REFERENCES Tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (commented_by) REFERENCES Users (email) ON DELETE SET NULL
    )`);
    
};
