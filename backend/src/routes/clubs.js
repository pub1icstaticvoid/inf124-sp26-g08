const express = require("express");
const { Types } = require("mongoose");
const Club = require("../models/Club");
const { generateUniqueInviteCode } = require("../utils/inviteCodes");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);

const serializeClub = (club) => ({
  id: club._id.toString(),
  name: club.name,
  description: club.description,
  inviteCode: club.inviteCode,
  lastMsg: club.description || "No messages yet",
  memberCount: club.members?.length ?? 0,
});

router.get("/clubs", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const clubs = await Club.find({ members: userId }).sort({ updatedAt: -1 }).lean();

    res.json({ success: true, clubs: clubs.map(serializeClub) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs", async (req, res) => {
  try {
    const { ownerId, name, description } = req.body;

    if (!isValidId(ownerId)) {
      return res.status(400).json({ error: "invalid ownerId format" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const inviteCode = await generateUniqueInviteCode(Club, "CLUB");
    const club = await Club.create({
      ownerId,
      name: name.trim(),
      description: description?.trim() ?? "",
      members: [ownerId],
      inviteCode,
    });

    res.status(201).json({ success: true, club: serializeClub(club) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs/join", async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: "inviteCode is required" });
    }

    const club = await Club.findOneAndUpdate(
      { inviteCode: inviteCode.trim().toUpperCase() },
      { $addToSet: { members: userId } },
      { new: true }
    );

    if (!club) {
      return res.status(404).json({ error: "club not found for that invite code" });
    }

    res.json({ success: true, club: serializeClub(club) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
