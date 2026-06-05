const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    theme: { type: String, default: "dark" },
    accentIndex: { type: Number, default: 0 },
    notifications: {
      desktop: { type: Boolean, default: true },
      dms: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      canvas: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const clubProfileSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "Member" },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    avatarUrl: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    graduationYear: { type: String, trim: true, default: "" },
    clubs: { type: [clubProfileSchema], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    settings: { type: settingsSchema, default: () => ({}) },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
