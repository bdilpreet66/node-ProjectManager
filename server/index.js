const express = require('express');
const mongoose = require('mongoose');


const app = express();
const port = 3000;

app.use(express.json());

const userRouter = require('./routes/users');
const projectRouter = require('./routes/projects');
const workHourRouter = require('./routes/workHours');
const prerequisiteRouter = require('./routes/prerequisites');
const taskCommentRouter = require('./routes/taskComments');

// Use routers
app.use('/tasks', taskRouter);
app.use('/users', userRouter);
app.use('/projects', projectRouter);
app.use('/workHours', workHourRouter);
app.use('/prerequisites', prerequisiteRouter);
app.use('/taskComments', taskCommentRouter);


mongoose
	.connect('mongodb+srv://dilpreetbrar:Fairytail1@pmapi.r3dbwo3.mongodb.net/PmAPI?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log("connected to mongo db");

		app.listen(port, () => {
			console.log(`App running on http://localhost:${port}`);
		});
	})
	.catch((error) => {
		console.log(error)
	})
