const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
