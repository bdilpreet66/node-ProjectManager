const express = require('express');
const router = express.Router();
const WorkHour = require('../../models/WorkHour');
const User = require('../../models/User');

router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const workHours = await WorkHour.find({ task_id: taskId }).populate('recorded_by', 'hourly_rate');
        res.json(workHours);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.post('/', async (req, res) => {
    try {
        const { hours, minutes, recorded_date, approved, task_id, email } = req.body; // Email needs to be passed in the request body
        const newWorkHour = new WorkHour({ hours, minutes, recorded_date, approved, task_id, recorded_by: email });
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
        await WorkHour.findByIdAndUpdate(workHourId, { approved: true });
        res.json({ message: 'Work hour approved.' });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.patch('/disapprove/:workHourId', async (req, res) => {
    try {
        const { workHourId } = req.params;
        await WorkHour.findByIdAndUpdate(workHourId, { approved: false });
        res.json({ message: 'Work hour disapproved.' });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});



module.exports = router;
