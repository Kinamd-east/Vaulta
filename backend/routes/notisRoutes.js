const express = require("express");
const router = express.Router();
const { getNotifications } = require("../controllers/notificationsController");

router.post("/:id", getNotifications);

module.exports = router;
