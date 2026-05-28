// announcements

const express = require("express");
const router = express.Router();
const { getDb } = require("../db");
const { ObjectId } = require("mongodb");

router.get("/announcements", async (req, res) => {
    try {
        const db = getDb();

        const flatAnnouncements = await db.collection("announcements")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const groupedAnnouncements = flatAnnouncements.reduce((acc, curr) => {
            let group = acc.find(g => g.label === curr.groupName);

            if (!group) {
                group = {
                    id: `ann-${curr.groupName.replace(/\s+/g, '-').toLowerCase()}`,
                    label: curr.groupName,
                    announcements: []
                };
                acc.push(group);
            }

            group.announcements.push({
                id: curr._id.toString(),
                title: curr.title,
                body: curr.body,
                createdAt: curr.createdAt
            });

            return acc;
        }, []);

        res.json({ success: true, groups: groupedAnnouncements });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/announcements", async (req, res) => {
    try {
        const db = getDb();
        const { groupName, authorId, title, body } = req.body;

        if (!ObjectId.isValid(authorId)) return res.status(400).json({ error: "invalid authorId format" });

        const newAnnouncement = {
            groupName,
            authorId: new ObjectId(authorId),
            title,
            body,
            createdAt: new Date()
        }

        const result = await db.collection("announcements").insertOne(newAnnouncement);

        res.status(201).json({
            success: true,
            message: "announcement posted successfully",
            announcement: { ...newAnnouncement, _id: result.insertedId }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;