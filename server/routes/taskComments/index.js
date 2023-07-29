const express = require('express');
const router = express.Router();
const TaskComment = require('../../models/TaskComment');
const User = require('../../models/User');

router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const taskComments = await TaskComment.find({ task_id: taskId }).sort({ comment_date: -1 }).populate('commented_by');
        const formattedComments = taskComments.map((comment) => {
            let user = comment.commented_by;
            user = user.first_name
                ? `${user.first_name} ${user.last_name}`
                : user.email;
            return { ...comment._doc, commented_by: user, comment_date: comment.formatted_comment_date  };
        });
        res.json(formattedComments); // Send the formattedComments array in the response
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
