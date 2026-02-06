const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    return res.json({
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        age: user.age,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, age } = req.body;
    
    if (!nom || !prenom || !age) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.nom = nom;
    user.prenom = prenom;
    user.age = age;
    // Email is not updated - it's non-editable

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        age: user.age,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err) });
  }
};
