const express = require('express');
const router = express.Router();
const Task = require('../../models/Task');
const Project = require('../../models/Project');

// Create a task
router.post('/', async (req, res) => {
    try {
        const task = new Task(req.body);
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
        const tasks = await Task.find({ project_id: req.params.projectId });
        res.send(tasks);
    } catch (error) {
        console.error('Error getting tasks by project:', error);
        res.status(500).send({ message: 'Error getting tasks by project' });
    }
});

// Update a task
router.put('/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
    try {
        const prerequisites = await Prerequisite.find({ task: req.params.taskId });

        res.send(prerequisites);
    } catch (error) {
        console.error('Error listing prerequisites:', error);
        res.status(500).send({ message: 'Error listing prerequisites' });
    }
});

// New route to list incomplete prerequisites for a task
router.get('/:taskId/prerequisites/incomplete', async (req, res) => {
    try {
        const prerequisites = await Prerequisite.find({ task: req.params.taskId })
            .populate({
                path: 'prerequisite_task',
                match: { status: { $ne: 'completed' } }
            });

        // Filter out nulls from population
        const incompletePrerequisites = prerequisites.filter(p => p.prerequisite_task !== null);

        res.send(incompletePrerequisites);
    } catch (error) {
        console.error('Error listing incomplete prerequisites:', error);
        res.status(500).send({ message: 'Error listing incomplete prerequisites' });
    }
});

router.get('/byMember/:memberEmail', async (req, res) => {
    try {
        const { memberEmail } = req.params;
        const tasks = await Task.find({ assigned_to: memberEmail }).populate('project_id', 'name');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});


module.exports = router;
