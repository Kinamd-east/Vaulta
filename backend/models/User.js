const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: Number,
  from: String,
  txHash: String,
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING",
  },
  timestamp: { type: Date, default: Date.now },
});

const assetSchema = new mongoose.Schema({
  symbol: String, // e.g., "ETH", "SHIBA", "JUP"
  name: String, // e.g., "Ethereum", "Shiba Inu", "Jupiter"
  balance: { type: Number, default: 0 },
  contractAddress: String, // ERC-20/SPL address (or empty for native)
  decimals: { type: Number, default: 18 },
  usdBalance: { type: Number, default: 0 },
  isNative: { type: Boolean, default: false }, // true if it's ETH, SOL, TON
});

const walletSchema = new mongoose.Schema(
  {
    type: String, // 'ethereum', 'solana', etc.
    name: { type: String, default: "Wallet" },
    balance: { type: Number, default: 0 },
    address: String,
    totalBalance: { type: Number, default: 0 },
    privateKeyHashed: String,
    privateKeyIv: String,
    encryptedMnemonic: String,
    isPhraseSaved: { type: Boolean, default: false },
    passwordHash: String,
    mnemonicIv: String,
    assets: [assetSchema],
    transactions: [transactionSchema],
  },
  { timestamps: true },
);

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["INFO", "ALERT", "TRANSACTION", "SECURITY", "PROMOTION"],
      default: "INFO",
    },
    status: {
      type: String,
      enum: ["UNREAD", "READ"],
      default: "UNREAD",
    },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    passwordHash: String,
    transactions: [transactionSchema],
    wallets: [walletSchema],
    notifications: [notificationSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
