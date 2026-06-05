const express = require("express");
const { Types } = require("mongoose");
const Message = require("../models/Message");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);

router.post("/messages", async (req, res) => {
  try {
    const { conversationId, senderId, senderName, category, text } = req.body;

    if (!isValidId(conversationId) || !isValidId(senderId)) {
      return res.status(400).json({ error: "invalid conversationId or senderId format" });
    }

    if (!senderName || !text || !category) {
      return res.status(400).json({ error: "senderName, category, and text are required" });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      senderName: senderName.trim(),
      category,
      text: text.trim(),
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!isValidId(conversationId)) {
      return res.status(400).json({ error: "invalid conversationId format" });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    if (!isValidId(messageId)) {
      return res.status(400).json({ error: "invalid messageId format" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          text: text.trim(),
          isEdited: true,
        },
      },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "message not found" });
    }

    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!isValidId(messageId)) {
      return res.status(400).json({ error: "invalid messageId format" });
    }

    const deletedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!deletedMessage) {
      return res.status(404).json({ error: "message not found" });
    }

    res.json({ success: true, message: "message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
