const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// related for reset password
const OTP = require("../models/OTP");
const emailService = require("../services/emailService");

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


// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Don't reveal if email exists or not for security
    if (!user) {
      return res.json({ message: "If email exists, OTP has been sent" });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Save OTP
    await OTP.create({
      email,
      code: otpCode,
      expiresAt,
      verified: false,
    });

    // Send email
    try {
      await emailService.sendOTPEmail(email, otpCode);
      return res.json({ message: "OTP sent to email" });
    } catch (emailError) {
      console.error("Email error:", emailError);
      return res.status(500).json({ message: "Failed to send email" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const otpRecord = await OTP.findOne({
      email,
      code,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return res.json({ message: "OTP verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Verify OTP was verified
    const otpRecord = await OTP.findOne({
      email,
      code,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

