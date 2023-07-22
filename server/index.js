const express = require('express');
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const WorkHour = require('./models/WorkHour');
const Prerequisite = require('./models/Prerequisite');
const TaskComment = require('./models/TaskComment');


const app = express();
const port = 3000;

app.use(express.json());

const userRoutes = require('./routes/users');

// Use routers
app.use('/users', userRoutes);


mongoose
.connect('mongodb+srv://dilpreetbrar:Fairytail1@pmapi.r3dbwo3.mongodb.net/PmAPI?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
  console.log("connected to mongo db");

  app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
  });
})
.catch((error) => {
  console.log(error)
})
