const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema(
  {
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 2,
        message: "A friend conversation must contain exactly two users.",
      },
    },
    membersKey: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.models.Friend || mongoose.model("Friend", friendSchema);
