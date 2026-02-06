const router = require("express").Router();
const { register, login, forgotPassword, verifyOTP, resetPassword } = require("../controllers/authController");


router.post("/register", register);
router.post("/login", login);
// reset password routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
