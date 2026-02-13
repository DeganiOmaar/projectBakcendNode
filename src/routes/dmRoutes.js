const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { getPeers, getConversation, markConversationRead, getTotalUnread } = require("../controllers/dmController");

router.get("/peers", requireAuth, getPeers);
router.get("/unread-total", requireAuth, getTotalUnread);
router.get("/conversation/:peerId", requireAuth, getConversation);
router.post("/conversation/:peerId/read", requireAuth, markConversationRead);

module.exports = router;
