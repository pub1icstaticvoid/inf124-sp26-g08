const express = require("express");
const { Types } = require("mongoose");
const Announcement = require("../models/Announcement");

const router = express.Router();

router.get("/announcements", async (req, res) => {
  try {
    const flatAnnouncements = await Announcement.find({}).sort({ createdAt: -1 }).lean();

    const groupedAnnouncements = flatAnnouncements.reduce((acc, curr) => {
      let group = acc.find((item) => item.label === curr.groupName);

      if (!group) {
        group = {
          id: `ann-${curr.groupName.replace(/\s+/g, "-").toLowerCase()}`,
          label: curr.groupName,
          announcements: [],
        };
        acc.push(group);
      }

      group.announcements.push({
        id: curr._id.toString(),
        title: curr.title,
        body: curr.body,
        createdAt: curr.createdAt,
      });

      return acc;
    }, []);

    res.json({ success: true, groups: groupedAnnouncements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/announcements", async (req, res) => {
  try {
    const { groupName, authorId, title, body } = req.body;

    if (!Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ error: "invalid authorId format" });
    }

    if (!groupName || !title || !body) {
      return res.status(400).json({ error: "groupName, title, and body are required" });
    }

    const announcement = await Announcement.create({
      groupName: groupName.trim(),
      authorId,
      title: title.trim(),
      body: body.trim(),
    });

    res.status(201).json({
      success: true,
      message: "announcement posted successfully",
      announcement,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
