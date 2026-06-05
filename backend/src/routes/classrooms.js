const express = require("express");
const { Types } = require("mongoose");
const Classroom = require("../models/Classroom");
const { emitToUser, emitToUsers } = require("../socketState");
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
  toIdString,
} = require("../utils/groupEntities");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);
const classroomCategory = "Classes";

async function loadClassroomWithMembers(classroomId) {
  return Classroom.findById(classroomId).populate("members", "username email profile");
}

const getClassroomMemberIds = (classroom) => (classroom.members ?? []).map(toIdString).filter(Boolean);

const emitClassroomRefresh = (classroom, userIds = getClassroomMemberIds(classroom)) => {
  emitToUsers(userIds, "conversation_upserted", (targetUserId) => ({
    category: classroomCategory,
    conversation: serializeGroupSummary(classroom, targetUserId),
  }));

  emitToUsers(userIds, "group_detail_changed", {
    category: classroomCategory,
    conversationId: classroom._id.toString(),
  });
};

router.get("/classrooms", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const classrooms = await Classroom.find({ members: userId }).sort({ updatedAt: -1 }).lean();

    res.json({
      success: true,
      classrooms: classrooms.map((classroom) => serializeGroupSummary(classroom, userId)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/classrooms/search", async (req, res) => {
  try {
    const { userId, q = "" } = req.query;

    if (!ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const trimmedQuery = q.trim();
    if (!trimmedQuery) {
      return res.json({ success: true, classrooms: [] });
    }

    const classrooms = await Classroom.find({
      name: { $regex: trimmedQuery, $options: "i" },
      members: { $ne: userId },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      classrooms: classrooms.map(serializeGroupSearchResult),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/classrooms/:classroomId", async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { userId } = req.query;

    if (!isValidId(classroomId) || !ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid classroomId or userId format" });
    }

    const classroom = await loadClassroomWithMembers(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (!hasMember(classroom, userId)) {
      return res.status(403).json({ error: "you must join this classroom before viewing details" });
    }

    res.json({
      success: true,
      classroom: serializeGroupDetail(classroom, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms", async (req, res) => {
  try {
    const { ownerId, name, description } = req.body;

    if (!ensureValidUserId(ownerId)) {
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
      managers: [ownerId],
      inviteCode,
    });

    emitClassroomRefresh(classroom, [ownerId]);

    res.status(201).json({
      success: true,
      classroom: serializeGroupSummary(classroom, ownerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms/join", async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;

    if (!ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: "inviteCode is required" });
    }

    const classroom = await Classroom.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found for that invite code" });
    }

    if (hasMember(classroom, userId)) {
      return res.status(409).json({ error: "you are already a member of this classroom" });
    }

    classroom.members.push(userId);
    await classroom.save();
    emitClassroomRefresh(classroom);

    res.json({
      success: true,
      message: `Joined classroom: ${classroom.name}`,
      classroom: serializeGroupSummary(classroom, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms/:classroomId/join", async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { userId } = req.body;

    if (!isValidId(classroomId) || !ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid classroomId or userId format" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (hasMember(classroom, userId)) {
      return res.status(409).json({ error: "you are already a member of this classroom" });
    }

    classroom.members.push(userId);
    await classroom.save();
    emitClassroomRefresh(classroom);

    res.json({
      success: true,
      message: `Joined classroom: ${classroom.name}`,
      classroom: serializeGroupSummary(classroom, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms/:classroomId/managers", async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { managerId, memberId } = req.body;

    if (!isValidId(classroomId) || !ensureValidUserId(managerId) || !ensureValidUserId(memberId)) {
      return res.status(400).json({ error: "invalid classroomId, managerId, or memberId format" });
    }

    const classroom = await loadClassroomWithMembers(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (!isManager(classroom, managerId)) {
      return res.status(403).json({ error: "only managers can promote members" });
    }

    if (!hasMember(classroom, memberId)) {
      return res.status(404).json({ error: "member not found in this classroom" });
    }

    if (isManager(classroom, memberId)) {
      return res.status(409).json({ error: "that member is already a manager" });
    }

    classroom.managers = [...getManagerIds(classroom), memberId];
    await classroom.save();

    const updatedClassroom = await loadClassroomWithMembers(classroomId);
    emitClassroomRefresh(updatedClassroom);
    res.json({
      success: true,
      message: "Member promoted to manager",
      classroom: serializeGroupDetail(updatedClassroom, managerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms/:classroomId/members", async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { managerId, email } = req.body;

    if (!isValidId(classroomId) || !ensureValidUserId(managerId)) {
      return res.status(400).json({ error: "invalid classroomId or managerId format" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "email is required" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (!isManager(classroom, managerId)) {
      return res.status(403).json({ error: "only managers can invite members" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "user not found for that email" });
    }

    if (hasMember(classroom, user._id.toString())) {
      return res.status(409).json({ error: "that user is already a member of this classroom" });
    }

    classroom.members.push(user._id);
    await classroom.save();

    const updatedClassroom = await loadClassroomWithMembers(classroomId);
    emitClassroomRefresh(updatedClassroom);
    res.json({
      success: true,
      message: `${user.username} added to classroom`,
      classroom: serializeGroupDetail(updatedClassroom, managerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/classrooms/:classroomId/leave", async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { userId } = req.body;

    if (!isValidId(classroomId) || !ensureValidUserId(userId)) {
      return res.status(400).json({ error: "invalid classroomId or userId format" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (!hasMember(classroom, userId)) {
      return res.status(404).json({ error: "you are not a member of this classroom" });
    }

    if (isManager(classroom, userId)) {
      return res
        .status(403)
        .json({ error: "managers cannot leave directly. Promote another manager or delete the classroom instead." });
    }

    classroom.members = classroom.members.filter((member) => member.toString() !== userId.toString());
    await classroom.save();

    const updatedClassroom = await loadClassroomWithMembers(classroomId);
    emitToUser(userId, "conversation_removed", {
      category: classroomCategory,
      conversationId: classroomId,
      notice: `You left classroom: ${classroom.name}`,
    });

    if (updatedClassroom) {
      emitClassroomRefresh(updatedClassroom);
    }

    res.json({
      success: true,
      message: `You left classroom: ${classroom.name}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/classrooms/:classroomId/members/:memberId", async (req, res) => {
  try {
    const { classroomId, memberId } = req.params;
    const { managerId } = req.query;

    if (!isValidId(classroomId) || !ensureValidUserId(memberId) || !ensureValidUserId(managerId)) {
      return res.status(400).json({ error: "invalid classroomId, memberId, or managerId format" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (!isManager(classroom, managerId)) {
      return res.status(403).json({ error: "only managers can remove members" });
    }

    if (memberId === managerId) {
      return res.status(400).json({ error: "use delete classroom if you want to remove yourself as manager" });
    }

    if (!hasMember(classroom, memberId)) {
      return res.status(404).json({ error: "member not found in this classroom" });
    }

    const managerIds = getManagerIds(classroom);
    if (managerIds.includes(memberId) && managerIds.length === 1) {
      return res.status(400).json({ error: "cannot remove the only remaining manager" });
    }

    classroom.members = classroom.members.filter((member) => member.toString() !== memberId);
    classroom.managers = managerIds.filter((id) => id !== memberId);
    await classroom.save();

    const updatedClassroom = await loadClassroomWithMembers(classroomId);
    emitToUser(memberId, "conversation_removed", {
      category: classroomCategory,
      conversationId: classroomId,
      notice: `You were removed from classroom: ${classroom.name}`,
    });
    if (updatedClassroom) {
      emitClassroomRefresh(updatedClassroom);
    }
    res.json({
      success: true,
      message: "Member removed from classroom",
      classroom: serializeGroupDetail(updatedClassroom, managerId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/classrooms/:classroomId", async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { managerId } = req.query;

    if (!isValidId(classroomId) || !ensureValidUserId(managerId)) {
      return res.status(400).json({ error: "invalid classroomId or managerId format" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: "classroom not found" });
    }

    if (!isManager(classroom, managerId)) {
      return res.status(403).json({ error: "only managers can delete classrooms" });
    }

    const memberIds = getClassroomMemberIds(classroom);
    await Classroom.findByIdAndDelete(classroomId);

    emitToUsers(memberIds, "conversation_removed", {
      category: classroomCategory,
      conversationId: classroomId,
      notice: `Classroom deleted: ${classroom.name}`,
    });

    res.json({ success: true, message: "classroom deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
