const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    inviteCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);
