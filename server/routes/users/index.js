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
        await user.remove();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ email: -1 }).limit(10).skip((req.query.page - 1) * 10);
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
            res.status(400).json({ success: false, data: '', message: 'Incorrect email or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
