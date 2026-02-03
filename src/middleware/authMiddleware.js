const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization; // "Bearer TOKEN"
    if (!header) return res.status(401).json({ message: "No token" });

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return res.status(401).json({ message: "Bad token format" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid", error: String(err) });
  }
};


