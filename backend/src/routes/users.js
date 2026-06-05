const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDb } = require("../db");

const isValidId = (id) => ObjectId.isValid(id);

router.get("/users/:userId/profile", async (req, res) => {
    try {
        const db = getDb();
        const { userId } = req.params;

        if (!isValidId(userId)) return res.status(400).json({ error: "invalid userId format" });

        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { passwordHash: 0 } }
        );

        if (!user) return res.status(404).json({ error: "user not found" });

        res.json({
            success: true,
            username: user.username,
            email: user.email,
            profile: user.profile || {}
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/users/:userId/profile", async (req, res) => {
    try {
        const db = getDb();
        const { userId } = req.params;
        const { avatarUrl, bio, position, department, graduationYear, clubs } = req.body;

        if (!isValidId(userId)) return res.status(400).json({ error: "invalid userId format" });

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    "profile.avatarUrl":      avatarUrl,
                    "profile.bio":            bio,
                    "profile.position":       position,
                    "profile.department":     department,
                    "profile.graduationYear": graduationYear,
                    "profile.clubs":          clubs
                }
            }
        );

        if (result.matchedCount === 0) return res.status(404).json({ error: "user not found" });

        res.json({ success: true, message: "profile updated successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/users/:userId/settings", async (req, res) => {
    try {
        const db = getDb();
        const { userId } = req.params;
        const { theme, accentIndex, notifications } = req.body;

        if (!isValidId(userId)) return res.status(400).json({ error: "invalid userId format" });

        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { settings: { theme, accentIndex, notifications } } }
        );

        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;