// handles users collection and hashes the passwords

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { getDb } = require("../db");

router.post("/signup", async (req, res) => {
    try {
        const db = getDb();
        const { username, email, password } = req.body;

        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered"});

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            email,
            passwordHash: hashedPassword,
            settings: {
                theme: "dark",
                accentIndex: 0,
                notifications: {
                    desktop: true,
                    dms: true,
                    mentions: true,
                    canvas: true
                }
            },
            createdAt: new Date()
        };

        const result = await db.collection("users").insertOne(newUser);
        res.status(201).json({ success: true, userId: result.insertedId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const db = getDb();
        const { email, password } = req.body;

        const user = await db.collection("users").findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) return res.status(401).json({ error: "Invalid email or password"});

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                settings: user.settings
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;