require("./env");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { Types } = require("mongoose");
const { connectDb, mongoose } = require("./db");
const Message = require("./models/Message");
const { getUserRoom, setIo } = require("./socketState");
const { getRoomKey } = require("./utils/socketRooms");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");
const announcementsRoutes = require("./routes/announcements");
const classroomRoutes = require("./routes/classrooms");
const clubRoutes = require("./routes/clubs");
const friendRoutes = require("./routes/friends");

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  const dbReadyState = mongoose.connection.readyState;
  const dbStatus = dbReadyState === 1 ? "connected" : "disconnected";

  res.json({
    success: true,
    server: "ok",
    database: {
      status: dbStatus,
      name: mongoose.connection.name || null,
      readyState: dbReadyState,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", userRoutes);
app.use("/api", announcementsRoutes);
app.use("/api", classroomRoutes);
app.use("/api", clubRoutes);
app.use("/api", friendRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});
setIo(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register_user", (userId) => {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }

    socket.join(getUserRoom(userId));
  });

  socket.on("join_room", ({ category, conversationId }) => {
    if (!category || !conversationId) {
      return;
    }

    socket.join(getRoomKey(category, conversationId));
  });

  socket.on("leave_room", ({ category, conversationId }) => {
    if (!category || !conversationId) {
      return;
    }

    socket.leave(getRoomKey(category, conversationId));
  });

  socket.on("send_message", async (messageData) => {
    try {
      if (!messageData?.category || !messageData?.conversationId) {
        return;
      }

      let outgoingMessage = {
        id: messageData.id ?? messageData.messageId ?? Date.now().toString(),
        user: messageData.user ?? "Unknown",
        senderId: messageData.senderId ?? null,
        text: messageData.text ?? "",
        category: messageData.category,
        conversationId: messageData.conversationId,
        timestamp: messageData.timestamp ?? new Date().toISOString(),
      };

      const shouldPersist =
        messageData.persist === true &&
        Types.ObjectId.isValid(messageData.conversationId) &&
        Types.ObjectId.isValid(messageData.senderId) &&
        outgoingMessage.text.trim();

      if (shouldPersist) {
        const savedMessage = await Message.create({
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          senderName: outgoingMessage.user,
          category: messageData.category,
          text: outgoingMessage.text.trim(),
        });

        outgoingMessage = {
          id: savedMessage._id.toString(),
          user: savedMessage.senderName,
          senderId: savedMessage.senderId.toString(),
          text: savedMessage.text,
          category: savedMessage.category,
          conversationId: savedMessage.conversationId.toString(),
          timestamp: savedMessage.timestamp,
        };
      }

      io.to(getRoomKey(outgoingMessage.category, outgoingMessage.conversationId)).emit(
        "receive_message",
        outgoingMessage
      );
    } catch (error) {
      socket.emit("message_error", { error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();

    server.listen(PORT, () => {
      console.log(`Server is live on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed");
    console.error(error);
  }
};

startServer();
