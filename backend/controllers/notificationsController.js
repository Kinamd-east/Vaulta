const User = require("../models/User");
const getNotifications = async (req, res) => {
  try {
    // Find the user who has the notification with the given ID
    const user = await User.findOne({ "notifications._id": req.params.id });

    if (!user) return res.status(404).json({ error: "Notification not found" });

    // Find the actual notification inside the user's notifications array
    const notis = user.notifications.id(req.params.id);
    if (!notis)
      return res.status(404).json({ error: "Notification not found" });

    // Mark it as read
    notis.status = "READ";

    // Save the updated user
    await user.save();

    // Return the updated notification
    res.json(notis);
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { getNotifications };
