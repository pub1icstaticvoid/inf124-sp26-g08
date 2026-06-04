// express and server starter

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDb } = require("./db");

const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const userRoutes = require("./routes/users");
const announcementsRoutes = require("./routes/announcements");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", userRoutes);
app.use("/api", announcementsRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("send_message", (messageData) => {
    const outgoingMessage = {
      id: messageData.id ?? Date.now(),
      user: messageData.user ?? "Unknown",
      text: messageData.text ?? "",
      category: messageData.category,
      conversationId: messageData.conversationId,
      timestamp: Date.now(),
    };

    io.emit("receive_message", outgoingMessage);
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
      console.log(`Nodemon is watching, server is live on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed");
    console.error(error);
  }
};

startServer();