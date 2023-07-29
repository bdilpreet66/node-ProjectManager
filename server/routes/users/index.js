const express = require('express');
const router = express.Router();
const User = require('../../models/User');

// Example route

router.post('/', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:email/hours', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        user.first_name = req.body.first_name;
        user.last_name = req.body.last_name;
        user.job_title = req.body.job_title;
        user.hourly_rate = req.body.hourly_rate;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:email/password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        user.password = req.body.password;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        await User.deleteOne({ email: req.params.email });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: "Contact The admin" });
    }
});

router.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.query; // Get the search query from the request query parameters

        // Create a dynamic filter to match any of the fields (first_name, last_name, email, job_title)
        const filter = {
            $or: [
                { first_name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search
                { last_name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { job_title: { $regex: searchQuery, $options: 'i' } },
            ],
        };

        const users = await User.find(filter)
            .sort({ email: -1 })
            .limit(10)
            .skip((req.query.page - 1) * 10);

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/list', async (req, res) => {
    try {        
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/validate', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user && user.password === req.body.password) {
            res.json({ success: true, data: user, message: 'User login successful.' });
        } else {
            res.status(200).json({ success: false, data: '', message: 'Incorrect email or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
