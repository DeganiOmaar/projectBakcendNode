const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/userController");


router.get("/me", requireAuth, getProfile);
router.put("/update", requireAuth, updateProfile);

module.exports = router;
