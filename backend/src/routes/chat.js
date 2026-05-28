// messages logic

const express = require("express");
const router = express.Router();
const { ObjectId, Timestamp } = require("mongodb");
const { getDb } = require("../db");

const isValidId = (id) => ObjectId.isValid(id);

router.post("/messages", async (req, res) => {
    try {
        const db = getDb();
        const { conversationId, senderId, senderName, text } = req.body;

        if (!isValidId(conversationId) || !isValidId(senderId)) return res.status(400).json({error: "invalid conversionId or senderId format"});

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

        if (!isValidId(conversationId)) return res.status(400).json({error: "invalid conversationId format"});
        
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

router.put("/messages/:messageId", async (req, res) => {
    try {
        const db = getDb();
        const { messageId } = req.params;
        const { text } = req.body;

        if (!ObjectId.isValid(messageId)) return res.status(400).json({ error: "invalid messageId format" });

        const result = await db.collection("messages").updateOne(
            { _id: new ObjectId(messageId) },
            {
                $set: {
                    text: text,
                    isEdited: true,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) return res.status(404).json({error: "message not found"});

        res.json({ success: true, message: "message updated successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/messages/:messageId", async (req, res) => {
    try {
        const db = getDb();
        const { messageId } = req.params;

        if (!ObjectId.isValid(messageId)) return res.status(400).json({ error: "invalid messageId format" });

        const result = await db.collection("messages").updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { isDeleted: true } }
        );

        if (result.matchedCount === 0) return res.status(404).json({error: "message not found"});

        res.json({ success: true, message: "message deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;