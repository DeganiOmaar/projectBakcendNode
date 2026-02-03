const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

exports.register = async (req, res) => {
  try {
    const { nom, prenom, age, email, password } = req.body;

    if (!nom || !prenom || !age || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenom,
      age,
      email,
      password: hashed,
    });

    //  IMPORTANT: status 201
    return res.status(201).json({
      message: "Register success",
      user: { id: user._id, nom, prenom, age, email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);

    return res.json({
      message: "Login success",
      token,
      user: { id: user._id, nom: user.nom, prenom: user.prenom, age: user.age, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};
