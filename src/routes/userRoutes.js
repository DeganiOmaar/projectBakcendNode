const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
