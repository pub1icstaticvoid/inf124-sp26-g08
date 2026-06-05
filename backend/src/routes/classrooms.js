const express = require("express");
const { Types } = require("mongoose");
const Classroom = require("../models/Classroom");
const { generateUniqueInviteCode } = require("../utils/inviteCodes");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);

const serializeClassroom = (classroom) => ({
  id: classroom._id.toString(),
  name: classroom.name,
  description: classroom.description,
  inviteCode: classroom.inviteCode,
  lastMsg: classroom.description || "No messages yet",
  memberCount: classroom.members?.length ?? 0,
});

router.get("/classrooms", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const classrooms = await Classroom.find({ members: userId }).sort({ updatedAt: -1 }).lean();

    res.json({ success: true, classrooms: classrooms.map(serializeClassroom) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms", async (req, res) => {
  try {
    const { ownerId, name, description } = req.body;

    if (!isValidId(ownerId)) {
      return res.status(400).json({ error: "invalid ownerId format" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const inviteCode = await generateUniqueInviteCode(Classroom, "CLASS");
    const classroom = await Classroom.create({
      ownerId,
      name: name.trim(),
      description: description?.trim() ?? "",
      members: [ownerId],
      inviteCode,
    });

    res.status(201).json({ success: true, classroom: serializeClassroom(classroom) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms/join", async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: "inviteCode is required" });
    }

    const classroom = await Classroom.findOneAndUpdate(
      { inviteCode: inviteCode.trim().toUpperCase() },
      { $addToSet: { members: userId } },
      { new: true }
    );

    if (!classroom) {
      return res.status(404).json({ error: "classroom not found for that invite code" });
    }

    res.json({ success: true, classroom: serializeClassroom(classroom) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
