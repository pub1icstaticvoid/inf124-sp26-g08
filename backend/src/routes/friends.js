const express = require("express");
const { Types } = require("mongoose");
const Friend = require("../models/Friend");
const User = require("../models/User");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);

const makeMembersKey = (userIdA, userIdB) => [userIdA.toString(), userIdB.toString()].sort().join(":");

const serializeFriend = (conversation, currentUserId) => {
  const otherMember = conversation.members.find((member) => member._id.toString() !== currentUserId.toString());

  return {
    id: conversation._id.toString(),
    name: otherMember?.username ?? "Unknown Friend",
    email: otherMember?.email ?? "",
    friendUserId: otherMember?._id?.toString() ?? "",
    lastMsg: "Direct message",
  };
};

router.get("/friends", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const conversations = await Friend.find({ members: userId })
      .populate("members", "username email")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      friends: conversations.map((conversation) => serializeFriend(conversation, userId)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/friends/:friendId", async (req, res) => {
  try {
    const { friendId } = req.params;
    const { userId } = req.query;

    if (!isValidId(friendId) || !isValidId(userId)) {
      return res.status(400).json({ error: "invalid friendId or userId format" });
    }

    const conversation = await Friend.findById(friendId).populate("members", "username email profile");
    if (!conversation) {
      return res.status(404).json({ error: "friend conversation not found" });
    }

    const isParticipant = conversation.members.some((member) => member._id.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "you are not part of this friend conversation" });
    }

    const otherMember = conversation.members.find((member) => member._id.toString() !== userId.toString());

    res.json({
      success: true,
      friend: {
        id: conversation._id.toString(),
        userId: otherMember?._id?.toString() ?? "",
        name: otherMember?.username ?? "Unknown Friend",
        email: otherMember?.email ?? "",
        profile: otherMember?.profile ?? {},
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/friends", async (req, res) => {
  try {
    const { userId, friendEmail } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    if (!friendEmail || !friendEmail.trim()) {
      return res.status(400).json({ error: "friendEmail is required" });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "current user not found" });
    }

    const friendUser = await User.findOne({ email: friendEmail.trim().toLowerCase() });
    if (!friendUser) {
      return res.status(404).json({ error: "friend not found" });
    }

    if (friendUser._id.toString() === userId.toString()) {
      return res.status(400).json({ error: "you cannot add yourself as a friend" });
    }

    const membersKey = makeMembersKey(userId, friendUser._id);
    let conversation = await Friend.findOne({ membersKey }).populate("members", "username email");

    if (!conversation) {
      conversation = await Friend.create({
        members: [userId, friendUser._id],
        membersKey,
        createdBy: userId,
      });
      conversation = await Friend.findById(conversation._id).populate("members", "username email");
    }

    res.status(201).json({
      success: true,
      friend: serializeFriend(conversation, userId),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/friends/:friendId", async (req, res) => {
  try {
    const { friendId } = req.params;
    const { userId } = req.query;

    if (!isValidId(friendId) || !isValidId(userId)) {
      return res.status(400).json({ error: "invalid friendId or userId format" });
    }

    const conversation = await Friend.findById(friendId);
    if (!conversation) {
      return res.status(404).json({ error: "friend conversation not found" });
    }

    const isParticipant = conversation.members.some((member) => member.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "you are not part of this friend conversation" });
    }

    await Friend.findByIdAndDelete(friendId);
    res.json({ success: true, message: "friend removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
