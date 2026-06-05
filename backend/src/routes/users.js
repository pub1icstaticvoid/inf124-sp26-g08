const express = require("express");
const { Types } = require("mongoose");
const User = require("../models/User");

const router = express.Router();

const isValidId = (id) => Types.ObjectId.isValid(id);

router.get("/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const user = await User.findById(userId).select("-passwordHash").lean();

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    res.json({
      success: true,
      username: user.username,
      email: user.email,
      profile: user.profile || {},
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const { avatarUrl, bio, position, department, graduationYear, clubs } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profile.avatarUrl": avatarUrl ?? "",
          "profile.bio": bio ?? "",
          "profile.position": position ?? "",
          "profile.department": department ?? "",
          "profile.graduationYear": graduationYear ?? "",
          "profile.clubs": Array.isArray(clubs) ? clubs : [],
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    res.json({ success: true, message: "profile updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/users/:userId/settings", async (req, res) => {
  try {
    const { userId } = req.params;
    const { theme, accentIndex, notifications } = req.body;

    if (!isValidId(userId)) {
      return res.status(400).json({ error: "invalid userId format" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          settings: {
            theme: theme ?? "dark",
            accentIndex: typeof accentIndex === "number" ? accentIndex : 0,
            notifications: notifications ?? {
              desktop: true,
              dms: true,
              mentions: true,
              canvas: true,
            },
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    res.json({ success: true, settings: user.settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
