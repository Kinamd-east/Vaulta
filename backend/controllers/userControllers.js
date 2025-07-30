const User = require("../models/User");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ message: "username already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      passwordHash: hashedPassword,
      wallets: [],
      transactions: [],
      notifications: [],
    });
    const newNotis = {
      title: `From Vaulta`,
      message: `Welcome to Vaulta, ${username}! Create a wallet now to receive and send assets. Manage Ethereum, Solana, and your favorite tokens — all in one app with an extra layer of security on every transaction. Let’s get started!`,
      type: "INFO",
      status: "UNREAD",
    };
    user.notifications.push(newNotis);
    await user.save();
    req.session.userId = user._id;
    console.log(user);

    res.status(201).json({ message: "Registration Successful", user: user });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    req.session.userId = user._id;
    res
      .status(200)
      .json({ message: "Logged in successfully", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out" });
  });
};

const getMe = async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ message: "Not logged in" });

  const user = await User.findById(req.session.userId).select("-passwordHash");
  res.status(200).json({ user });
};

module.exports = { registerUser, getMe, login, logout };
