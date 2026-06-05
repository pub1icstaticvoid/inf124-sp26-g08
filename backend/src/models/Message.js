const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true, trim: true },
    category: { type: String, enum: ["DMs", "Classes", "Clubs"], required: true },
    text: { type: String, required: true, trim: true },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: "updatedAt" } }
);

messageSchema.index({ conversationId: 1, timestamp: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
