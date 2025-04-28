const express = require('express');
const router = express.Router();
const Helps = require('../models/Helps');

// Help request route
router.post('/', async (req, res) => {  // Change this line
    const { firstLname, phone, email, helpText } = req.body;

    if (!firstLname || !phone || !email || !helpText) {
        return res.status(400).json({ msg: "All fields are required." });
    }

    try {
        const helps = new Helps({
            firstLname,
            phone,
            email,
            helpText
        });
        await helps.save();

        return res.status(201).json({ msg: "Help request submitted successfully", helps });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server error", error: err.message });
    }
});
module.exports = router;