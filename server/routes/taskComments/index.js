const express = require('express');
const router = express.Router();
const TaskComment = require('../../models/TaskComment');

router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const taskComments = await TaskComment.find({ task_id: taskId }).sort({ id: -1 });
        res.json(taskComments);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

router.post('/', async (req, res) => {
    try {
        const { task_id, comment, commented_by } = req.body;
        const newTaskComment = new TaskComment({ task_id, comment, comment_date: Date.now(), commented_by });
        await newTaskComment.save();
        res.json({ message: 'Task comment inserted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});


module.exports = router;
