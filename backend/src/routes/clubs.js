const express = require("express");
const { Types } = require("mongoose");
const Club = require("../models/Club");
const { generateUniqueInviteCode } = require("../utils/inviteCodes");
const {
  ensureValidUserId,
  findUserByEmail,
  getManagerIds,
  hasMember,
  isManager,
  serializeGroupDetail,
  serializeGroupSearchResult,
  serializeGroupSummary,
} = require("../utils/groupEntities");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);

async function loadClubWithMembers(clubId) {
  return Club.findById(clubId).populate("members", "username email profile");
}

router.get("/clubs", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const clubs = await Club.find({ members: userId }).sort({ updatedAt: -1 }).lean();

    res.json({
      success: true,
      clubs: clubs.map((club) => serializeGroupSummary(club, userId)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/clubs/search", async (req, res) => {
  try {
    const { userId, q = "" } = req.query;

    if (!ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const trimmedQuery = q.trim();
    if (!trimmedQuery) {
      return res.json({ success: true, clubs: [] });
    }

    const clubs = await Club.find({
      name: { $regex: trimmedQuery, $options: "i" },
      members: { $ne: userId },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      clubs: clubs.map(serializeGroupSearchResult),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/clubs/:clubId", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { userId } = req.query;

    if (!isValidId(clubId) || !ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid clubId or userId format" });
    }

    const club = await loadClubWithMembers(clubId);
    if (!club) {
      return res.status(404).json({ error: "club not found" });
    }

    if (!hasMember(club, userId)) {
      return res.status(403).json({ error: "you must join this club before viewing details" });
    }

    res.json({
      success: true,
      club: serializeGroupDetail(club, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs", async (req, res) => {
  try {
    const { ownerId, name, description } = req.body;

    if (!ensureValidUserId(ownerId)) {
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
      managers: [ownerId],
      inviteCode,
    });

    res.status(201).json({
      success: true,
      club: serializeGroupSummary(club, ownerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs/join", async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;

    if (!ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: "inviteCode is required" });
    }

    const club = await Club.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!club) {
      return res.status(404).json({ error: "club not found for that invite code" });
    }

    if (hasMember(club, userId)) {
      return res.status(409).json({ error: "you are already a member of this club" });
    }

    club.members.push(userId);
    await club.save();

    res.json({
      success: true,
      message: `Joined club: ${club.name}`,
      club: serializeGroupSummary(club, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs/:clubId/join", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { userId } = req.body;

    if (!isValidId(clubId) || !ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid clubId or userId format" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: "club not found" });
    }

    if (hasMember(club, userId)) {
      return res.status(409).json({ error: "you are already a member of this club" });
    }

    club.members.push(userId);
    await club.save();

    res.json({
      success: true,
      message: `Joined club: ${club.name}`,
      club: serializeGroupSummary(club, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs/:clubId/managers", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { managerId, memberId } = req.body;

    if (!isValidId(clubId) || !ensureValidUserId(managerId) || !ensureValidUserId(memberId)) {
      return res.status(400).json({ error: "invalid clubId, managerId, or memberId format" });
    }

    const club = await loadClubWithMembers(clubId);
    if (!club) {
      return res.status(404).json({ error: "club not found" });
    }

    if (!isManager(club, managerId)) {
      return res.status(403).json({ error: "only managers can promote members" });
    }

    if (!hasMember(club, memberId)) {
      return res.status(404).json({ error: "member not found in this club" });
    }

    if (isManager(club, memberId)) {
      return res.status(409).json({ error: "that member is already a manager" });
    }

    club.managers = [...getManagerIds(club), memberId];
    await club.save();

    const updatedClub = await loadClubWithMembers(clubId);
    res.json({
      success: true,
      message: "Member promoted to manager",
      club: serializeGroupDetail(updatedClub, managerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/clubs/:clubId/members", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { managerId, email } = req.body;

    if (!isValidId(clubId) || !ensureValidUserId(managerId)) {
      return res.status(400).json({ error: "invalid clubId or managerId format" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "email is required" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: "club not found" });
    }

    if (!isManager(club, managerId)) {
      return res.status(403).json({ error: "only managers can invite members" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "user not found for that email" });
    }

    if (hasMember(club, user._id.toString())) {
      return res.status(409).json({ error: "that user is already a member of this club" });
    }

    club.members.push(user._id);
    await club.save();

    const updatedClub = await loadClubWithMembers(clubId);
    res.json({
      success: true,
      message: `${user.username} added to club`,
      club: serializeGroupDetail(updatedClub, managerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/clubs/:clubId/members/:memberId", async (req, res) => {
  try {
    const { clubId, memberId } = req.params;
    const { managerId } = req.query;

    if (!isValidId(clubId) || !ensureValidUserId(memberId) || !ensureValidUserId(managerId)) {
      return res.status(400).json({ error: "invalid clubId, memberId, or managerId format" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: "club not found" });
    }

    if (!isManager(club, managerId)) {
      return res.status(403).json({ error: "only managers can remove members" });
    }

    if (memberId === managerId) {
      return res.status(400).json({ error: "use delete club if you want to remove yourself as manager" });
    }

    if (!hasMember(club, memberId)) {
      return res.status(404).json({ error: "member not found in this club" });
    }

    const managerIds = getManagerIds(club);
    if (managerIds.includes(memberId) && managerIds.length === 1) {
      return res.status(400).json({ error: "cannot remove the only remaining manager" });
    }

    club.members = club.members.filter((member) => member.toString() !== memberId);
    club.managers = managerIds.filter((id) => id !== memberId);
    await club.save();

    const updatedClub = await loadClubWithMembers(clubId);
    res.json({
      success: true,
      message: "Member removed from club",
      club: serializeGroupDetail(updatedClub, managerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/clubs/:clubId", async (req, res) => {
  try {
    const { clubId } = req.params;
    const { managerId } = req.query;

    if (!isValidId(clubId) || !ensureValidUserId(managerId)) {
      return res.status(400).json({ error: "invalid clubId or managerId format" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ error: "club not found" });
    }

    if (!isManager(club, managerId)) {
      return res.status(403).json({ error: "only managers can delete clubs" });
    }

    await Club.findByIdAndDelete(clubId);
    res.json({ success: true, message: "club deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
