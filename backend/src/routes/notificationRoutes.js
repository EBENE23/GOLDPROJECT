const express = require("express");

const {
  listerNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
} = require("../controllers/notificationController");

const {
  verifierToken,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifierToken);

router.get("/", listerNotifications);

router.put(
  "/lire-toutes",
  marquerToutesNotificationsLues
);

router.put(
  "/:id/lire",
  marquerNotificationLue
);

module.exports = router;