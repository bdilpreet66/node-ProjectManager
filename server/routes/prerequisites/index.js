const express = require('express');
const router = express.Router();
const Prerequisite = require('../../models/Prerequisite');
const Task = require('../../models/Task');

// Recursive function to check for indirect dependencies
async function isIndirectDependency(taskId, prerequisiteTaskId) {
	const prerequisites = await Prerequisite.find({ task_id: prerequisiteTaskId });

	for (let prerequisite of prerequisites) {
		if (prerequisite.prerequisite_task_id.toString() === taskId.toString()) {
			return true;
		} else {
			const indirect = await isIndirectDependency(taskId, prerequisite.prerequisite_task_id);
			if (indirect) {
				return true;
			}
		}
	}

	return false;
}

// New route to create a prerequisite
router.post('/', async (req, res) => {
	try {
		if (await isIndirectDependency(req.body.task_id, req.body.prerequisite_task_id)) {
			res.status(500).send({ message: `Task ID #${req.body.task_id} is an indirect dependency of Task ID #${req.body.prerequisite_task_id}.`});
		} else {

			const prerequisite = new Prerequisite(req.body);
			const savedPrerequisite = await prerequisite.save();

			res.send(savedPrerequisite);

		}
	} catch (error) {
		console.error('Error creating prerequisite:', error);
		res.status(500).send({ message: 'Error creating prerequisite' });
	}
});


router.delete('/:taskId/:prerequisiteTaskId', async (req, res) => {
	try {
		const { taskId, prerequisiteTaskId } = req.params;
		await Prerequisite.deleteOne({ task_id: taskId, prerequisite_task_id: prerequisiteTaskId });
		res.json({ message: `Prerequisite deleted: Task ${prerequisiteTaskId} is no longer a prerequisite for Task ${taskId}` });
	} catch (error) {
		res.status(500).json({ error: error.toString() });
	}
});

module.exports = router;
