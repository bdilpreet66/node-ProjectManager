const express = require('express');
const router = express.Router();
const Prerequisite = require('../../models/Prerequisite');
const Task = require('../../models/Task');
const Project = require('../../models/Project');
const User = require('../../models/User');

// Create a task
router.post('/', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.assigned_to });
        const task = new Task({ ...req.body, assigned_to: user._id });
        const savedTask = await task.save();
        res.send(savedTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send({ message: 'Error creating task' });
    }
});

// Get tasks by project
router.get('/project/:projectId', async (req, res) => {
    try {
        const tasks = await Task.find({ project_id: req.params.projectId })
            .populate('assigned_to'); // Populate the 'assigned_to' field with the entire User document

        // Modify the tasks array to include the first name and last name of the assigned user
        const tasksWithAssignedUser = tasks.map((task) => {
            const assignedUser = task.assigned_to;
            return {
                id: task._id,
                name: task.name,
                description: task.description,
                start_date: task.start_date,
                end_date: task.end_date,
                assigned_to: assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : task.assigned_to,
                is_active: task.is_active,
                status: task.status,
                project_id: task.project_id,
            };
        });

        res.send(tasksWithAssignedUser);
    } catch (error) {
        console.error('Error getting tasks by project:', error);
        res.status(500).send({ message: 'Error getting tasks by project' });
    }
});

// Update a task

router.put('/:id', async (req, res) => {
    try {
        // Find user by email
        const user = await User.findOne({ _id: req.body.assigned_to });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Assign user._id to assigned_to
        req.body.assigned_to = user._id;
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body);
        if (updatedTask) {
            const tasks = await Task.find({ project_id: updatedTask.project_id });
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

            let projectStatus;
            if (allCompleted) {
                projectStatus = 'completed';
            } else if (anyInProgress) {
                projectStatus = 'in-progress';
            } else {
                projectStatus = 'pending';
            }
            const updatedProject = await Project.findByIdAndUpdate(updatedTask.project_id, { status: projectStatus, completion_date: new Date() }, { new: true });
            res.send({ updatedTask, updatedProject });
        } else {
            res.status(404).send({ message: 'No task found with the provided ID' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send({ message: 'Error updating task' });
    }
});


router.put('/:id/status', async (req, res) => {
    try {
        const { status, project } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (updatedTask) {
            const tasks = await Task.find({ project_id: project });
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

            let projectStatus;
            if (allCompleted) {
                projectStatus = 'completed';
            } else if (anyInProgress) {
                projectStatus = 'in-progress';
            } else {
                projectStatus = 'pending';
            }
            const updatedProject = await Project.findByIdAndUpdate(project, { status: projectStatus }, { new: true });
            res.send({ updatedTask, updatedProject });
        } else {
            res.status(404).send({ message: 'No task found with the provided ID' });
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).send({ message: 'Error updating task status' });
    }
});


router.get('/work-history/:projectId', async (req, res) => {
    try {
        const workHours = await WorkHour.find({ project: req.params.projectId, approved: true })
            .populate({
                path: 'task',
                select: 'name assigned_to'
            })
            .populate({
                path: 'recorded_by',
                select: 'email hourly_rate'
            });

        const workHistory = workHours.map(wh => ({
            task_id: wh.task._id,
            task_name: wh.task.name,
            assigned_to: wh.task.assigned_to,
            recorded_date: wh.recorded_date,
            hours: wh.hours,
            minutes: wh.minutes,
            recorded_by: wh.recorded_by.email,
            cost: (wh.recorded_by.hourly_rate * wh.hours) + (wh.recorded_by.hourly_rate * wh.minutes / 60)
        }));

        res.json(workHistory);
    } catch (error) {
        console.error('Error getting work history by project:', error);
        res.status(500).send({ message: 'Error getting work history by project' });
    }
});

router.get('/:taskId/prerequisites', async (req, res) => {
    const { taskId } = req.params;
    try {
        const prerequisites = await Prerequisite.find({ task_id: taskId });

        // Extract the prerequisite task IDs from the results
        const prerequisiteTaskIds = prerequisites.map((prerequisite) => prerequisite.prerequisite_task_id);

        // Find the names of the prerequisite tasks using the extracted IDs
        const prerequisiteTasks = await Task.find({ _id: { $in: prerequisiteTaskIds } });

        // Extract and return the names of the prerequisite tasks
        const prerequisiteTaskNames = prerequisiteTasks.map((task) => task.name);

        res.json(prerequisiteTaskNames);
    } catch (error) {
        console.error('Error listing prerequisites:', error);
        res.status(500).send({ message: 'Error listing prerequisites' });
    }
});

router.get('/:taskId/prerequisites/incomplete', async (req, res) => {
    try {
        const prerequisites = await Prerequisite.find({ task_id: req.params.taskId })
            .populate({
                path: 'prerequisite_task_id',
                match: { status: { $ne: 'completed' } }
            });

        // Filter out nulls from population
        const incompletePrerequisites = prerequisites.filter(p => p.prerequisite_task_id !== null);

        res.send(incompletePrerequisites);
    } catch (error) {
        console.error('Error listing incomplete prerequisites:', error);
        res.status(500).send({ message: 'Error listing incomplete prerequisites' });
    }
});

router.get('/byMember/:assigned_to', async (req, res) => {
    console.log('Assigned To',req.params.assigned_to);
    try {
        
        const assignedTo = req.params.assigned_to;
        const searchQuery = req.query.searchText || ''; // Get the search query from the request query parameters
        const statusFilter = req.query.status; // Get the status filter from the request query parameters

        // Initialize the filter with the search conditions
        let filter = {
            $and: [
                { assigned_to: assignedTo }, 
                {
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search in the 'name' field
                        { description: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search in the 'description' field
                    ]
                }
            ]
        };

        // If a status filter is provided, add it to the filter
        if (statusFilter) {
            filter.status = statusFilter;
        }

        console.log(`Filter: ${JSON.stringify(filter)}`);

        const tasks = await Task.find(filter)
            .populate('project_id', 'name') // populates the 'name' field from the 'Project' model
            .limit(10)
            .skip((req.query.page - 1) * 10);

        console.log('Tasks from server',tasks);

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



//Get task details by id
router.get('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: 'No task found with this ID.' });
        }
        res.json(task);
    } catch (err) {
        console.error(`Error fetching task with ID ${taskId}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
});


router.get('/available/:projectId/:currentTaskId', async (req, res) => {
    const { projectId, currentTaskId } = req.params;

    try {
        // Find all tasks that have the same project_id as the given projectId
        // and exclude the task with the currentTaskId
        const tasks = await Task.find({
            project_id: projectId,
            _id: { $ne: currentTaskId },
        });

        // Prepare the list of available tasks with additional information
        const availableTasks = await Promise.all(tasks.map(async (task) => {
            const prerequisiteExists = await Prerequisite.exists({
                prerequisite_task_id: currentTaskId,
                task_id: task._id,
            });

            // If prerequisiteExists is true, skip this task
            if (prerequisiteExists) {
                return null;
            } else {
                const isCurrentTaskPrerequisite = await Prerequisite.exists({
                    prerequisite_task_id: task._id,
                    task_id: currentTaskId,
                });

                return {
                    id: task._id,
                    name: task.name,
                    isPreReq: isCurrentTaskPrerequisite,
                };
            }
        }));

        // Remove any null values from the availableTasks array
        const filteredAvailableTasks = availableTasks.filter((task) => task !== null);

        res.json(filteredAvailableTasks);
    } catch (error) {
        console.error('Error getting available tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;