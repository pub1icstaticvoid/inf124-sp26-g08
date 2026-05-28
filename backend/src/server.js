// express and server starter

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDb } = require("./db");

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

const PORT = process.env.PORT || 5000;

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Nodemon is watching, server is live on port ${PORT}`);
    });
});