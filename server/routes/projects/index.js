const express = require('express');
const router = express.Router();
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const WorkHour = require('../../models/WorkHour');
const User = require('../../models/User');
const TaskComment = require('../../models/TaskComment');

router.get('/', async (req, res) => { 
    console.log(req.query);
   
    try {
        const searchQuery = req.query.searchText; // Get the search query from the request query parameters
        const sortOrder = req.query.sortOrder === 'true' ? 1 : -1; // Set the sort order based on the request query parameter
        const statusFilter = req.query.status; // Get the status filter from the request query parameters

        // Initialize the filter with the search conditions
        let filter = { 
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search
                { description: { $regex: searchQuery, $options: 'i' } },                
            ]
        };

        // If a status filter is provided, add it to the filter
        if(statusFilter !== "") {
            filter = {
                $and: [
                    filter,
                    { status: statusFilter }
                ]
            }
        }

        console.log(`Filter:${JSON.stringify(filter)}`);
        const projects = await Project.find(filter)
            .sort({ total_cost: Number(sortOrder) })
            .limit(10)
            .skip((req.query.page - 1) * 10);

        console.log(projects);            

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add project
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;        
        const user = await User.findOne({ email: req.params.email });
        const newProject = new Project({ name, description, created_by: user });
        const savedProject = await newProject.save();
        res.send(savedProject);
    } catch (err) {
        console.error('Error adding project:', err);
        res.status(500).send({ message: 'Error adding project' });
    }
});

// Update project
router.put('/update/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description } = req.body;
        const updatedProject = await Project.findByIdAndUpdate(id, { name, description }, { new: true });
        if (updatedProject) {
            res.send(updatedProject);
        } else {
            res.status(404).send({ message: 'No project found with the provided ID' });
        }
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).send({ message: 'Error updating project' });
    }
});


router.get('/getProjectProgress', async (req, res) => {
    try {
        const projects = await Project.find()
            .lean()
            .exec();

        const projectProgressPromises = projects.map(async (project) => {
            const taskCount = await Task.countDocuments({ project_id: project._id });
            const completedTasks = await Task.countDocuments({
                project_id: project._id,
                status: 'completed',
            });
            project.progress = taskCount === 0 ? 0 : (completedTasks / taskCount) * 100;

            return project;
        });

        const projectProgress = await Promise.all(projectProgressPromises);
        res.json(projectProgress);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});


router.get('/getInprogressOverdueTasks/:assigned_to', async (req, res) => {
    try {
        const tasks = await Task.find({
            status: { $nin: ['completed'] },
            assigned_to: req.params.assigned_to,  // Use req.params.assigned_to here
        })
            .sort({ end_date: 1 })
            .lean()
            .exec();

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.get('/getProjectSummary', async (req, res) => {
    try {
        const completedProjects = await Project.countDocuments({ status: 'completed' });
        const completedTasks = await Task.countDocuments({ status: 'completed' });
        const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
        const overdueTasks = await Task.countDocuments({
            status: { $ne: 'completed' },
            end_date: { $lt: new Date() },
        });
        const pendingTasks = await Task.countDocuments({ status: 'pending' });
        const totalProjects = await Project.countDocuments({});
        const totalTasks = await Task.countDocuments({});

        // Calculate total cost using aggregation
        const totalCostResult = await WorkHour.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'recorded_by',
                    foreignField: 'email',
                    as: 'user',
                },
            },
            {
                $match: {
                    approved: true,
                },
            },
            {
                $group: {
                    _id: null,
                    totalCost: {
                        $sum: {
                            $multiply: ['$$ROOT.hours', { $arrayElemAt: ['$user.hourly_rate', 0] }],
                        },
                    },
                },
            },
        ]);

        const totalCost = totalCostResult[0]?.totalCost || 0;

        res.json({
            completed_projects: completedProjects,
            completed_tasks: completedTasks,
            inprogress_tasks: inProgressTasks,
            overdue_tasks: overdueTasks,
            pending_tasks: pendingTasks,
            total_cost: totalCost,
            total_projects: totalProjects,
            total_tasks: totalTasks,
        });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.get('/getProjectSummaryByMember/:assigned_to', async (req, res) => {
    try {
        const completedProjects = await Project.countDocuments({ 'tasks.assigned_to': req.params.assigned_to, status: 'completed' });
        const completedTasks = await Task.countDocuments({ assigned_to: req.params.assigned_to, status: 'completed' });
        const inProgressTasks = await Task.countDocuments({ assigned_to: req.params.assigned_to, status: 'in-progress' });
        const overdueTasks = await Task.countDocuments({
            assigned_to: req.params.assigned_to,
            status: { $ne: 'completed' },
            end_date: { $lt: new Date() },
        });
        const pendingTasks = await Task.countDocuments({ assigned_to: req.params.assigned_to, status: 'pending' });
        const totalProjects = await Project.countDocuments({ 'tasks.assigned_to': req.params.assigned_to });
        const totalTasks = await Task.countDocuments({ assigned_to: req.params.assigned_to });

        // Calculate total cost using aggregation
        const totalCostResult = await WorkHour.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'recorded_by',
                    foreignField: 'email',
                    as: 'user',
                },
            },
            {
                $match: {
                    approved: true,
                    'user._id': req.params.assigned_to,
                },
            },
            {
                $group: {
                    _id: null,
                    totalCost: {
                        $sum: {
                            $multiply: ['$$ROOT.hours', { $arrayElemAt: ['$user.hourly_rate', 0] }],
                        },
                    },
                },
            },
        ]);

        const totalCost = totalCostResult[0]?.totalCost || 0;

        res.json({
            completed_projects: completedProjects,
            completed_tasks: completedTasks,
            inprogress_tasks: inProgressTasks,
            overdue_tasks: overdueTasks,
            pending_tasks: pendingTasks,
            total_cost: totalCost,
            total_projects: totalProjects,
            total_tasks: totalTasks
        });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.get('/getbyid/:id', async (req, res) => {    
    try {
        const projectId = req.params.id;
        console.log(`projectId: ${projectId}`);
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'No project found with this ID.' });
        }
        console.log(`project: ${project}`);
        res.json(project);
    } catch (err) {
        console.error(`Error fetching project with ID ${projectId}:`, err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
