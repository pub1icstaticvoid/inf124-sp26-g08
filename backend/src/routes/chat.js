// messages logic

const express = require("express");
const router = express.Router();
const { ObjectId, Timestamp } = require("mongodb");
const { getDb } = require("../db");

router.post("/messages", async (req, res) => {
    try {
        const db = getDb();
        const { conversationId, senderId, senderName, text } = req.body;

        const newMessage = {
            conversationId: new ObjectId(conversationId),
            senderId: new ObjectId(senderId),
            senderName,
            text,
            timestamp: new Date(),
            isEdited: false,
            isDeleted: false
        };

        const result = await db.collection("messages").insertOne(newMessage);

        res.status(201).json({ success: true, message: { ...newMessage, _id: result.insertedId}});
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/messages/:conversationId", async (req, res) => {
    try {
        const db = getDb();
        const { conversationId } = req.params;
        
        const messages = await db.collection("messages")
            .find({
                conversationId: new ObjectId(conversationId),
                isDeleted: false
            })
            .sort({ timestamp: 1})
            .toArray();

        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;