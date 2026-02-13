const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

const userSockets = new Map(); // userId -> Set of socketIds

function registerSocketHandler(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Auth required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id nom prenom");
      if (!user) return next(new Error("User not found"));
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token "));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    socket.on("send_message", async (payload) => {
      try {
        const { to: receiverId, content } = payload;
        if (!receiverId || !content?.trim()) return;

        const msg = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content.trim(),
        });

        const populated = await Message.findById(msg._id)
          .populate("sender", "nom prenom")
          .populate("receiver", "nom prenom")
          .lean();

        const payloadOut = {
          id: populated._id,
          content: populated.content,
          senderId: populated.sender._id.toString(),
          senderName: `${populated.sender.prenom} ${populated.sender.nom}`,
          receiverId: populated.receiver._id.toString(),
          createdAt: populated.createdAt,
        };

        socket.emit("new_message", { ...payloadOut, isFromMe: true });

        const receiverSockets = userSockets.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((sid) => {
            io.to(sid).emit("new_message", { ...payloadOut, isFromMe: false });
          });
        }
      } catch (err) {
        socket.emit("message_error", { message: err.message || "Failed to send" });
      }
    });

    socket.on("disconnect", () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
    });
  });
}

module.exports = { registerSocketHandler };
