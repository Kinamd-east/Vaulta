const express = require("express");
const router = express.Router();
const {
  registerUser,
  getMe,
  login,
  logout,
} = require("../controllers/userControllers");

router.post("/register", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.get("/getMe", getMe);

module.exports = router;
