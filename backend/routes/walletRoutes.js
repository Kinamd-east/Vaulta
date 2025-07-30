const express = require("express");
const router = express.Router();
const {
  createWallet,
  sendToWallet,
  getWallet,
  sendPinCode,
  markPhraseSaved,
  revealMnemonic,
} = require("../controllers/walletControllers");

router.post("/create", createWallet);
router.post("/send-crypto/:id", sendToWallet);
router.post("/mark-phrase-saved/:id", markPhraseSaved);
router.post("/reveal-phrase/:id", revealMnemonic);
router.post("/confirm-transaction/:id", sendPinCode);
router.get("/get-wallet/:id", getWallet);

module.exports = router;
