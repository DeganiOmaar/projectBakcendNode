const User = require("../models/User");
const Message = require("../models/Message");

exports.getPeers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password")
      .sort({ nom: 1, prenom: 1 });

    const peerIds = users.map((u) => u._id);
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: currentUserId,
          sender: { $in: peerIds },
          readAt: null,
        },
      },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);

    const unreadMap = {};
    unreadCounts.forEach((r) => {
      unreadMap[r._id.toString()] = r.count;
    });

    return res.json({
      peers: users.map((u) => ({
        id: u._id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        unreadCount: unreadMap[u._id.toString()] || 0,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { peerId } = req.params;

    const peer = await User.findById(peerId).select("-password");
    if (!peer) return res.status(404).json({ message: "User not found" });

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: peerId },
        { sender: peerId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "nom prenom")
      .lean();

    return res.json({
      peer: {
        id: peer._id,
        nom: peer.nom,
        prenom: peer.prenom,
        email: peer.email,
      },
      messages: messages.map((m) => ({
        id: m._id,
        content: m.content,
        senderId: m.sender._id.toString(),
        senderName: `${m.sender.prenom} ${m.sender.nom}`,
        createdAt: m.createdAt,
        isFromMe: m.sender._id.toString() === currentUserId.toString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.getTotalUnread = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const count = await Message.countDocuments({
      receiver: currentUserId,
      readAt: null,
    });
    return res.json({ totalUnread: count });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { peerId } = req.params;

    await Message.updateMany(
      { sender: peerId, receiver: currentUserId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return res.json({ message: "Marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};
