const express = require('express');
const router = express.Router();
const WorkHour = require('../../models/WorkHour');
const User = require('../../models/User');
const Task = require('../../models/Task');
const Project = require('../../models/Project');

router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const page = parseInt(req.query.page) || 0;
        const limit = 10; // Number of records per page
        const skip = page > 1 ? ((page - 1) * limit) : 0;
        const workHours = await WorkHour.find({ task_id: taskId })
            .populate('recorded_by')
            .skip(skip)
            .limit(limit);
        res.json(workHours);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.post('/', async (req, res) => {
    try {
        const { hours, minutes, recorded_date, approved, task_id, recorded_by } = req.body; // Email needs to be passed in the request body
        const user = await User.findOne({email: recorded_by});
        if(!user) {
            return res.status(400).json({ error: "User not found with the provided email." });
        }
        const newWorkHour = new WorkHour({ hours, minutes, recorded_date, approved, task_id, recorded_by: user._id, rate: user.hourly_rate });
        await newWorkHour.save();
        res.json({ message: 'Worked hour created successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});


router.get('/totalCost/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const pipeline = [
            {
                $match: {
                    task_id: taskId,
                    approved: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'recorded_by',
                    foreignField: 'email',
                    as: 'user',
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
        ];
        const result = await WorkHour.aggregate(pipeline);
        const totalCost = result[0]?.totalCost || 0;
        res.json({ totalCost: totalCost.toFixed(2) });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});


router.patch('/approve/:workHourId', async (req, res) => {
    try {
        const { workHourId } = req.params;
        const workHour = await WorkHour.findById(workHourId);
        if (workHour.approved) {
            return res.status(400).json({ message: "WorkHour is already approved" });
        }
        const cost = (workHour.hours * workHour.rate) + (workHour.minutes/60 * workHour.rate);
        await Task.findByIdAndUpdate(workHour.task_id, { $inc: { cost: cost } });
        const task = await Task.findById(workHour.task_id);
        await Project.findByIdAndUpdate(task.project_id, { $inc: { total_cost: cost } });
        await WorkHour.findByIdAndUpdate(workHourId, { approved: true });
        res.json({ message: 'Work hour approved.' });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.patch('/disapprove/:workHourId', async (req, res) => {
    try {
        const { workHourId } = req.params;
        const workHour = await WorkHour.findById(workHourId);
        if (!workHour.approved) {
            return res.status(400).json({ message: "WorkHour is already disapproved" });
        }
        const cost = (workHour.hours * workHour.rate) + (workHour.minutes/60 * workHour.rate);
        await Task.findByIdAndUpdate(workHour.task_id, { $inc: { cost: -cost } });
        const task = await Task.findById(workHour.task_id);
        await Project.findByIdAndUpdate(task.project_id, { $inc: { total_cost: -cost } });
        await WorkHour.findByIdAndUpdate(workHourId, { approved: false });
        res.json({ message: 'Work hour disapproved.' });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});




module.exports = router;
