import { executeSql } from './storage';
import { getUserData } from './creds';

export const listProjects = async (page, searchText) => {
    try {
      const offset = (page - 1) * 10; // Assuming each page shows 10 projects
      const limit = 10; // Number of projects to fetch per page
  
      let query = 'SELECT * FROM Projects';
      let params = [];
  
      user = await getUserData(); 
  
      if (searchText) {
        query += ` WHERE created_by = '${user.email}' AND 
                  (Lower(name) LIKE '%${searchText.toLowerCase()}%' OR
                   Lower(description) LIKE '%${searchText.toLowerCase()}%')`; 
      } else {
        query += ` WHERE created_by = '${user.email}'`
      }
  
      query += ' ORDER BY id DESC'; // Assuming you want to order by the project ID in descending order
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      console.log(query)
      const results = await executeSql(query, params); // Execute the SQL query with parameters
      console.log(results)
  
      // Format the results as needed, assuming each result row is an object with properties matching the table columns
      const projects = results.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        total_hours_worked: row.total_hours_worked,
        completion_date: (row.completion_date === null) ? "" : row.completion_date,
        created_by: row.created_by,
        status: row.status,
      }));
  
      return projects;
    } catch (error) {
      return [];
    }
};

export const getAvailableTasks = async (projectId, currentTaskId) => {
  try {
    let query = `SELECT Tasks.id, Tasks.name,
                    CASE WHEN EXISTS (SELECT 1 FROM Prerequisites 
                                      WHERE Prerequisites.prerequisite_task_id = Tasks.id 
                                      AND Prerequisites.task_id = ${currentTaskId})
                        THEN 1 
                        ELSE 0 
                    END AS isPreReq
                FROM Tasks
                WHERE Tasks.project_id = ${projectId}
                AND Tasks.id != ${currentTaskId}
                AND NOT EXISTS (
                SELECT 1 FROM Prerequisites 
                WHERE Prerequisites.prerequisite_task_id = ${currentTaskId} 
                AND Prerequisites.task_id = Tasks.id)`;

    const results = await executeSql(query, []); // Execute the SQL query with parameters
    console.log(results)
    // Format the results as needed, assuming each result row is an object with properties matching the table columns
    let tasks = results.map((row) => ({
      id: row.id,
      name: row.name,
      isPreReq: Boolean(row.isPreReq),
    }));
    
    return tasks;
  } catch (error) {
    return [];
  }
};

export const addProject = async (name, description) => {
  try {
    const user = await getUserData(); 

    let query = `INSERT INTO Projects (name, description, created_by) VALUES ('${name}','${description}','${user.email}')`;
    let params = [];    
    
    console.log('Project Add Query: ' + query);
    const results = await executeSql(query, params); // Execute the SQL query with parameters
    return results;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

export const updateProjectByID = async (id, projectData) => {
  try {
      const { name, description } = projectData;

      let query = `
          UPDATE Projects 
          SET 
              name = '${name}', 
              description = '${description}'                            
          WHERE id = ${id};
      `;

      let params = [];
      console.log(id);

      console.log('Project Update Query: ' + query);
      const results = await executeSql(query, params);

      if (results.rowsAffected > 0) {
          console.log('Project updated successfully.');
      } else {
          console.log('No project found with the provided ID.');
      }
      return results.rowsAffected > 0;
  } catch (error) {
      console.error('Error updating project:', error);
      throw error;
  }
};

export const createTask = async (task) => {
  try {
    let query = `INSERT INTO Tasks (name, description, start_date, end_date, assigned_to, status, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      task.name,
      task.description,
      task.start_date,
      task.end_date,
      task.assigned_to,
      task.status,
      task.project_id,
    ];

    await executeSql(query, params);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (task) => {
  try {
    console.log("GO: ", task)
    let query = 'UPDATE Tasks SET name = ?, description = ?, start_date = ?, end_date = ?, assigned_to = ?, status = ? WHERE id = ?';
    const params = [
      task.name,
      task.description,
      task.start_date,
      task.end_date,
      task.assigned_to,
      task.status,
      task.id,
    ];
    await executeSql(query, params);

    // Fetch all tasks associated with the same project_id
    const tasks = await executeSql('SELECT * FROM Tasks WHERE project_id = ?', [task.project_id]);
    // Check the status of all tasks
    let allCompleted = true;
    let anyInProgress = false;
    for (let task of tasks) {
      if (task.status !== 'completed') {
        allCompleted = false;
      }
      if (task.status !== 'pending') {
        anyInProgress = true;
      }
    }

    // Update project status based on task statuses
    let projectStatus;
    if (allCompleted) {
      projectStatus = 'completed';
    } else if (anyInProgress) {
      projectStatus = 'in-progress';
    } else {
      projectStatus = 'pending';
    }
    
    let currentDate = new Date();

    // Format the date as a string in the format SQLite can store it.
    // You can adjust this format to suit your needs, but YYYY-MM-DD is a common format for SQL databases.
    let formattedDate = currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
    
    await executeSql('UPDATE Projects SET status = ?, completion_date = ? WHERE id = ?', [projectStatus, formattedDate, task.project_id]);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (id, status, project) => {
  try {
    let query = 'UPDATE Tasks SET status = ? WHERE id = ?';
    const params = [
      status,
      id
    ];
    await executeSql(query, params);

    console.log("task updated", project)
    // Fetch all tasks associated with the same project_id
    const tasks = await executeSql('SELECT * FROM Tasks WHERE project_id = ?', [project]);
    // Check the status of all tasks
    let allCompleted = true;
    let anyInProgress = false;
    for (let task of tasks) {
      if (task.status !== 'completed') {
        allCompleted = false;
      }
      if (task.status !== 'pending') {
        anyInProgress = true;
      }
    }

    // Update project status based on task statuses
    let projectStatus;
    if (allCompleted) {
      projectStatus = 'completed';
    } else if (anyInProgress) {
      projectStatus = 'in-progress';
    } else {
      projectStatus = 'pending';
    }
    await executeSql('UPDATE Projects SET status = ? WHERE id = ?', [projectStatus, project]);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}


export const getTasksByProject = async (projectId) => {
  try {
    let query = `SELECT * FROM Tasks WHERE project_id = ${projectId}`;

    const results = await executeSql(query, []); // Execute the SQL query with parameters

    // Format the results as needed, assuming each result row is an object with properties matching the table columns
    let tasks = results.map((row) => ({
      id: row.id,
      name: row.name,
      end_date: row.end_date,
      start_date: row.start_date,
      assigned_to: row.assigned_to,
      status: row.status,
      description: row.description,
      project_id: row.project_id,
    }));    

    return tasks;
  } catch (error) {
    return [];
  }
};

export const getWorkHistoryByProjectId = async (projectId) => {
  try {
      let query = `
          SELECT 
              Tasks.id AS task_id,
              Tasks.name AS task_name,
              Tasks.assigned_to,
              WorkHours.recorded_date,
              WorkHours.hours,
              WorkHours.minutes,
              WorkHours.recorded_date,
              WorkHours.recorded_by,
              (Users.hourly_rate * WorkHours.hours) + (Users.hourly_rate * WorkHours.minutes / 60) as cost
          FROM Tasks 
          INNER JOIN 
            WorkHours ON Tasks.id = WorkHours.task_id
          INNER JOIN 
            Users ON WorkHours.recorded_by = Users.email
          WHERE Tasks.project_id = ? AND WorkHours.approved = 1
          ORDER BY WorkHours.recorded_date DESC`;

      let params = [projectId];

      const results = await executeSql(query, params);
            
      return results;
  } catch (error) {
      return []
  }
};

export const isIndirectDependency = async (taskId, prerequisiteTaskId) => {
  let query = `SELECT prerequisite_task_id FROM Prerequisites WHERE task_id = ?`;
  let params = [prerequisiteTaskId];

  const results = await executeSql(query, params);

  if (results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      let row = results[i];
      if (row.prerequisite_task_id === taskId) {
        return true;
      } else {
        let indirect = await isIndirectDependency(taskId, row.prerequisite_task_id);
        if (indirect) {
          return true;
        }
      }
    }
  }

  return false;
};

export const createPrerequisite = async (taskId, prerequisiteTaskId) => {
  try {
    if (await isIndirectDependency(taskId, prerequisiteTaskId)) {
      throw new Error(`Task ID #${taskId} is an indirect dependency of Task ID #${prerequisiteTaskId}.`);
    }

    let query = `INSERT INTO Prerequisites (task_id, prerequisite_task_id) VALUES (?, ?)`;

    await executeSql(query, [taskId, prerequisiteTaskId]);

    console.log(`Prerequisite created: Task ${prerequisiteTaskId} is a prerequisite for Task ${taskId}`);
  } catch (error) {
    console.error('Error creating prerequisite:', error);
    throw error;
  }
};

export const listPrerequisite = async (taskId) => {
  try {
    let query = `SELECT * FROM Prerequisites WHERE task_id = ${taskId}`;

    const results = await executeSql(query, []);

    let tasks = results.map((row) => ({
      id: row.id,
      prerequisite_task_id: row.prerequisite_task_id,
    }));

    return tasks;
  } catch (error) {
    return []
  }
};

export const listIncompletePrerequisite = async (taskId) => {
  try {
    let query = `SELECT Prerequisites.* FROM Prerequisites INNER JOIN Tasks ON Tasks.id = Prerequisites.prerequisite_task_id WHERE Prerequisites.task_id = ${taskId} AND Tasks.status != 'completed'`;

    const results = await executeSql(query, []);

    let tasks = results.map((row) => ({
      id: row.id,
      prerequisite_task_id: row.prerequisite_task_id,
    }));

    return tasks;
  } catch (error) {
    return []
  }
};



export const deletePrerequisite = async (taskId, prerequisiteTaskId) => {
  try {
    let query = `DELETE FROM Prerequisites WHERE task_id = ? AND prerequisite_task_id = ?`;

    await executeSql(query, [taskId, prerequisiteTaskId]); // Execute the SQL query with parameters

    console.log(`Prerequisite deleted: Task ${prerequisiteTaskId} is no longer a prerequisite for Task ${taskId}`);
  } catch (error) {
    console.error('Error deleting prerequisite:', error);
    throw error;
  }
};


export const getTaskComments = async (taskId) => {
  try {    
    let query = `SELECT * FROM TaskComments WHERE task_id = ${taskId} ORDER BY id DESC`;    
    
    console.log('Task Comments Get Query: ' + query);
    const results = await executeSql(query, []); // Execute the SQL query with parameters

    return results;
    
  } catch (error) {
    return [];
  }
};

export const addTaskComment = async (comment,taskid) => {
  try {
    user = await getUserData();

    let query = `
      INSERT INTO TaskComments (task_id, comment, comment_date, commented_by) 
      VALUES (?, ?, datetime('now'), ?)
    `;
    let params = [taskid, comment, user.email];
    
    console.log('Task Comment Insert Query: ' + query);
    await executeSql(query, params); // Execute the SQL query with parameters
    
  } catch (error) {
    console.error('Error inserting task comment:', error);
    throw error;
  }
};


export const listWorkHours = async (page, id) => {
  try {
    const offset = (page - 1) * 10; // Assuming each page shows 10 work hours records
    const limit = 10; // Number of work hours records to fetch per page

    let query = `
      SELECT 
        WorkHours.*, 
        Users.hourly_rate,
        (Users.hourly_rate * WorkHours.hours) + (Users.hourly_rate * WorkHours.minutes / 60) as cost
      FROM 
        WorkHours 
      INNER JOIN 
        Users ON WorkHours.recorded_by = Users.email 
      WHERE 
        WorkHours.task_id = ${id}`;
      
    let params = [];
    
    query += ' ORDER BY WorkHours.recorded_date DESC'; // Assuming you want to order by the recorded date in descending order
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    const results = await executeSql(query, params); // Execute the SQL query with parameters

    // Format the results as needed, assuming each result row is an object with properties matching the table columns
    const workHours = results.map((row) => ({
      id: row.id,
      hours: row.hours,
      minutes: row.minutes,
      recorded_date: row.recorded_date,
      approved: row.approved,
      recorded_by: row.recorded_by,
      cost: row.cost,
    }));

    return workHours;
  } catch (error) {
    return [];
  }
};



export const getTasksByMember = async (page, searchText) => {
  try {
    const offset = (page - 1) * 10;
    const limit = 10;
    user = await getUserData();

    let query = `SELECT Tasks.*, Projects.name as project_name FROM Tasks INNER JOIN Projects ON Projects.id = Tasks.project_id WHERE Tasks.assigned_to = '${user.email}'`;
    let params = [];

    if (searchText) {
      query += ` AND Lower(Tasks.name) LIKE '%${searchText.toLowerCase()}%'`;
      
      // Check if searchText can be parsed to an integer
      if (!isNaN(parseInt(searchText))) {
        query += ` OR Tasks.id = ${parseInt(searchText)}`;
      }
    }

    query += ' ORDER BY Tasks.end_date';
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const results = await executeSql(query, params);

    const tasks = results.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      start_date: row.start_date,
      end_date: row.end_date,
      assigned_to: row.assigned_to,
      is_active: Boolean(row.is_active),
      status: row.status,
      project_name: row.project_name,
      project_id: row.project_id,
    }));

    return tasks;
  } catch (error) {
    return [];
  }
};


export const createWorkedHour = async (workedHour) => {
  const { hours, minutes, recorded_date, approved, task_id } = workedHour;

  user = await getUserData();
  
  const query = `INSERT INTO WorkHours (hours, minutes, recorded_date, approved, task_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [hours, minutes, recorded_date, approved, task_id, user.email];

  return executeSql(query, params);
};


export const calculateWorkedHour = async (id, user = "") => {
  try{
    // Calculate total cost
    const totalCostQuery = `
      SELECT 
        SUM(Users.hourly_rate * WorkHours.hours) as totalCost
      FROM 
        WorkHours 
      INNER JOIN 
        Users ON WorkHours.recorded_by = ${user ? user : 'Users.email'}
      WHERE 
        WorkHours.task_id = ${id}
      AND 
        WorkHours.approved = 1`; // Include only approved work hours in total cost calculation

    const totalCostResult = await executeSql(totalCostQuery, []);
    const totalCost = totalCostResult[0]?.totalCost || 0;

    return totalCost.toFixed(2);
  } catch (error) {
    return 0.00;
  }
};

export const getProjectTotalCost = async (projectId) => {
  try {
    let query = `SELECT id
    FROM Tasks
    WHERE project_id = ${projectId};`;
    const results = await executeSql(query, []);
    const tasksIds = results.map((row) => row.id); // Extract task ids into an array

    let totalCost = 0;

    for (let index = 0; index < tasksIds.length; index++) {
      const element = tasksIds[index];
      totalCost += parseFloat(await calculateWorkedHour(element))
    }

    return totalCost.toFixed(2);
  } catch (error) {
    return 0.00
  }
}

export const approveWorkHour = async (id) => {
  const sql = "UPDATE WorkHours SET approved = 1 WHERE id = ?";
  const params = [id];
  await executeSql(sql, params);
};

export const deleteWorkHours = async (id) => {
  const sql = "UPDATE WorkHours SET approved = 0 WHERE id = ?";
  const params = [id];
  await executeSql(sql, params);
};


export const getProjectProgress = async () => {
  try{
    const sql = `SELECT id, name, status, description, total_cost, completion_date,
    (SELECT MAX(end_date) FROM Tasks WHERE project_id = Projects.id) as due_date,
    ((SELECT COUNT(*) FROM Tasks WHERE status = 'completed' AND project_id = Projects.id) * 1.0 / 
    (SELECT COUNT(*) FROM Tasks WHERE project_id = Projects.id)) as progress
    FROM Projects`;
    const params = [];
    const result = await executeSql(sql, params);

    const projects = result.map((row) => ({
      id: row.id,
      name: row.name,
      due_date: row.due_date,
      status: row.status,
      progress: row.progress,
      description: row.description,
      total_cost: row.total_cost,
      completion_date: row.completion_date
    }));

    return projects;
  } catch {
    return [];
  }
};

export const getInprogressOverdueTasks = async () => {
  try {
    user = await getUserData();
    const sql = `SELECT Tasks.id, Tasks.name as name, Projects.name as project_name, 
    Tasks.assigned_to, Tasks.status, Tasks.end_date, Tasks.description, Tasks.start_date, Tasks.project_id
    FROM Tasks
    INNER JOIN Projects ON Tasks.project_id = Projects.id
    WHERE Tasks.status NOT IN ('completed') AND Tasks.assigned_to = '${user.email}'
    ORDER BY Tasks.end_date`;
    const params = [];
    const result = await executeSql(sql, params);
  
    const tasks = result.map((row) => ({
      id: row.id,
      name: row.name,
      project_name: row.project_name,
      assigned_to: row.assigned_to,
      end_date: row.end_date,
      status: row.status,
      description: row.description,
      start_date: row.start_date,
      project_id: row.project_id
    }));
  
    return tasks;
  } catch (error) {
    return [];
  }
};

export const getProjectSummary = async () => {
  const params = [];

  let sql = `
    SELECT COALESCE(COUNT(*), 0) AS completed_projects
    FROM Projects
    WHERE status = 'completed';
  `;
  const completedProjectsResult = await executeSql(sql, params);
  const completed_projects = completedProjectsResult[0].completed_projects;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS completed_tasks
    FROM Tasks
    WHERE status = 'completed';
  `;
  const completedTasksResult = await executeSql(sql, params);
  const completed_tasks = completedTasksResult[0].completed_tasks;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS inprogress_tasks
    FROM Tasks
    WHERE status = 'in-progress' AND date('now') < date(end_date);
  `;
  const inProgressTasksResult = await executeSql(sql, params);
  const inprogress_tasks = inProgressTasksResult[0].inprogress_tasks;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS overdue_tasks
    FROM Tasks
    WHERE status != 'completed' AND date('now') > date(end_date);
  `;
  const overdueTasksResult = await executeSql(sql, params);
  const overdue_tasks = overdueTasksResult[0].overdue_tasks;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS pending_tasks
    FROM Tasks
    WHERE status = 'pending' AND date('now') < date(end_date);
  `;
  const pendingTasksResult = await executeSql(sql, params);
  const pending_tasks = pendingTasksResult[0].pending_tasks;

  sql = `
    SELECT COALESCE(SUM((w.hours * u.hourly_rate) + (w.minutes / 60 * u.hourly_rate)), 0) as total_cost
    FROM Users u
    INNER JOIN Tasks t ON u.email = t.assigned_to
    INNER JOIN WorkHours w ON t.id = w.task_id
    WHERE w.approved = 1
  `;
  const totalCostResult = await executeSql(sql, params);
  const total_cost = totalCostResult[0].total_cost;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS total_projects
    FROM Projects;
  `;
  const totalProjectsResult = await executeSql(sql, params);
  const total_projects = totalProjectsResult[0].total_projects;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS total_tasks
    FROM Tasks;
  `;
  const totalTasksResult = await executeSql(sql, params);
  const total_tasks = totalTasksResult[0].total_tasks;

  return {
    completed_projects,
    completed_tasks,
    inprogress_tasks,
    overdue_tasks,
    pending_tasks,
    total_cost,
    total_projects,
    total_tasks,
  };
};

export const getProjectSummaryByMember = async () => {
  const user = await getUserData();
  const currentUserEmail = user.email;
  const params = [currentUserEmail];

  let sql = `
    SELECT COALESCE(COUNT(DISTINCT Tasks.project_id), 0) AS completed_projects
    FROM Projects
    INNER JOIN Tasks ON Tasks.project_id = Projects.id
    WHERE Projects.status = 'completed' AND Tasks.assigned_to = ?;
  `;
  const completedProjectsResult = await executeSql(sql, params);
  const completed_projects = completedProjectsResult[0].completed_projects;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS completed_tasks
    FROM Tasks
    WHERE status = 'completed' AND assigned_to = ?;
  `;
  const completedTasksResult = await executeSql(sql, params);
  const completed_tasks = completedTasksResult[0].completed_tasks;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS inprogress_tasks
    FROM Tasks
    WHERE status = 'in-progress' AND date('now') < date(end_date) AND assigned_to = ?;
  `;
  const inProgressTasksResult = await executeSql(sql, params);
  const inprogress_tasks = inProgressTasksResult[0].inprogress_tasks;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS overdue_tasks
    FROM Tasks
    WHERE status <> 'completed' AND date('now') > date(end_date) AND assigned_to = ?;
  `;

  const overdueTasksResult = await executeSql(sql, params);
  const overdue_tasks = overdueTasksResult[0].overdue_tasks;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS pending_tasks
    FROM Tasks
    WHERE status = 'pending' AND date('now') < date(end_date) AND assigned_to = ?;
  `;
  const pendingTasksResult = await executeSql(sql, params);
  const pending_tasks = pendingTasksResult[0].pending_tasks;

  sql = `
    SELECT COALESCE(SUM((COALESCE(w.hours,0) * u.hourly_rate) + (COALESCE(w.minutes,0) / 60 * u.hourly_rate)), 0) as total_cost
    FROM Users u
    INNER JOIN Tasks t ON u.email = t.assigned_to
    INNER JOIN WorkHours w ON t.id = w.task_id
    WHERE u.email = ? AND w.approved = 1
  `;
  const totalCostResult = await executeSql(sql, params);
  const total_cost = totalCostResult[0].total_cost;

  sql = `
    SELECT COALESCE(COUNT(DISTINCT Tasks.project_id), 0) AS total_projects
    FROM Projects
    INNER JOIN Tasks ON Tasks.project_id = Projects.id
    WHERE Tasks.assigned_to = ?;
  `;
  const totalProjectsResult = await executeSql(sql, params);
  const total_projects = totalProjectsResult[0].total_projects;

  sql = `
    SELECT COALESCE(COUNT(*), 0) AS total_tasks
    FROM Tasks
    WHERE assigned_to = ?;
  `;
  const totalTasksResult = await executeSql(sql, params);
  const total_tasks = totalTasksResult[0].total_tasks;

  return {
    completed_projects,
    completed_tasks,
    inprogress_tasks,
    overdue_tasks,
    pending_tasks,
    total_cost,
    total_projects,
    total_tasks,
  };
};




export const getProjectDetails = async (id) => {
  try {
    const sql = `SELECT id, name, status, description, total_cost, completion_date, created_by
    FROM Projects WHERE id = ${id}`;
    const params = [];
    const result = await executeSql(sql, params);
  
    const project = result.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      description: row.description,
      total_cost: row.total_cost,
      completion_date: row.completion_date
    }));
  
    return project;
  } catch (error) {
    return [];
  }
};
