require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { registerSocketHandler } = require("./socket/socketHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const dmRoutes = require("./routes/dmRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/dm", dmRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

registerSocketHandler(io);

const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err);
  });
