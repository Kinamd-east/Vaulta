const ethers = require("ethers");
const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendVerificationCode } = require("../utils/index.js"); // adjust path
require("dotenv").config();
const algorithm = "aes-256-cbc";
const secretKey = process.env.SECRET_KEY.padEnd(32).slice(0, 32);
const iv = crypto.randomBytes(16); // Initialization vector

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
  };
}

function decrypt(encryptedData, ivString) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    Buffer.from(ivString, "hex"),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
}

const createWallet = async (req, res) => {
  const userId = req.session.userId;
  const { name, chain, password } = req.body;
  try {
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const mnemonic = wallet.mnemonic.phrase;

    const user = await User.findById(userId);

    // Encrypt private key and mnemonic
    const { encryptedData: encryptedPrivateKey, iv: ivPrivateKey } =
      encrypt(privateKey);
    const { encryptedData: encryptedMnemonic, iv: ivMnemonic } =
      encrypt(mnemonic);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newWallet = {
      type: chain,
      name: name,
      balance: 0,
      totalBalance: 0,
      address: wallet.address,
      privateKeyHashed: encryptedPrivateKey,
      privateKeyIv: ivPrivateKey, // Store IV
      encryptedMnemonic: encryptedMnemonic, // Store encrypted mnemonic
      mnemonicIv: ivMnemonic, // Store mnemonic IV
      isPhraseSaved: false,
      passwordHash: hashedPassword,
      assets: [],
      transactions: [],
    };

    user.wallets.push(newWallet);
    await user.save();

    res.status(201).json({
      message: "Wallet Creation Successful",
      address: wallet.address,
    });
  } catch (err) {
    console.error("Wallet creation failed:", err);
    return res.status(500).json({ error: "Failed to create wallet" });
  }
};

const importWallet = async (req, res) => {
  const userId = req.session.userId;
  const { mnemonic, name, chain, password } = req.body;

  if (
    !mnemonic ||
    mnemonic.split(" ").length < 12 ||
    !name ||
    !chain ||
    !password
  ) {
    return res.status(400).json({
      error: "Mnemonic, name, chain, and password are required",
    });
  }

  try {
    // Import wallet from mnemonic
    const wallet = ethers.Wallet.fromPhrase(mnemonic);

    // Encrypt private key and mnemonic
    const encryptedPrivateKey = encrypt(wallet.privateKey);
    const encryptedMnemonic = encrypt(mnemonic);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new wallet object
    const newWallet = {
      type: chain,
      name,
      balance: 0,
      totalBalance: 0,
      address: wallet.address,
      privateKeyHashed: encryptedPrivateKey.encryptedData,
      mnemonicEncrypted: encryptedMnemonic.encryptedData,
      mnemonicIv: encryptedMnemonic.iv,
      isPhraseSaved: true,
      passwordHash: hashedPassword,
      assets: [],
      transactions: [],
    };

    // Save to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.wallets.push(newWallet);
    await user.save();

    return res.status(201).json({
      message: "Wallet imported and saved successfully",
      address: wallet.address,
    });
  } catch (err) {
    console.error("Wallet import failed:", err);
    return res
      .status(400)
      .json({ error: "Invalid mnemonic or failed to import" });
  }
};

const revealMnemonic = async (req, res) => {
  const userId = req.session.userId;
  const { password } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(userId);
    const wallet = user.wallets.id(id);
    const isMatch = await bcrypt.compare(password, wallet.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const decryptedMnemonic = decrypt(
      wallet.encryptedMnemonic,
      wallet.mnemonicIv,
    );
    await user.save();
    res.status(200).json({
      mnemonic: decryptedMnemonic,
      message: "successfully retrieved seed phrase",
    });
  } catch (err) {
    console.error("Mnemonic decryption failed:", err);
    return res.status(500).json({ error: "Failed to decrypt mnemonic" });
  }
};

const markPhraseSaved = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  try {
    const user = await User.findById(userId);
    const walletFromdb = user.wallets.id(id);

    walletFromdb.isPhraseSaved = true;

    await user.save();
    res.status(200).json({ message: "Phrase successfully saved" });
  } catch (err) {
    console.error("Mnemonic save failed", err);
    return res.status(500).json({ error: "Failed to save mnemonic" });
  }
};

// const sendPinCode = async (req, res) => {
//   const { id } = req.params;
//   const userId = req.session.userId;

//   try {
//     const user = await User.findById(userId);
//     const wallet = user.wallets.id(id);
//     if (!wallet) return res.status(404).json({ message: "Wallet not found" });

//     // Generate and send 6-digit PIN
//     const code = Math.floor(100000 + Math.random() * 900000).toString();
//     const success = await sendVerificationCode(user.email, code);

//     if (!success) {
//       return res
//         .status(500)
//         .json({ message: "Failed to send verification code" });
//     }
//     // Store code temporarily (e.g., in session or database)
//     req.session.transferCode = code;
//     req.session.walletIdForTransfer = id;

//     return res.status(200).json({
//       message: "Verification code sent to your email",
//     });
//   } catch (err) {
//     console.error("Send crypto failed:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// const sendToWallet = async (req, res) => {
//   const { id } = req.params;
//   const { pinCode, addressTo, amountInEth } = req.body;
//   const userId = req.session.userId;
//   if (!pinCode || !addressTo || !amountInEth) {
//     return res.status(400).json({ message: "Missing fields" });
//   }

//   if (!req.session.transferCode || pinCode !== req.session.transferCode) {
//     return res.status(401).json({ message: "Invalid verification code" });
//   }
//   try {
//     const user = await User.findById(userId);
//     const walletFromdb = user.wallets.id(id);
//     const privateKeyIv = walletFromdb.privateKeyIv;
//     const privateKeyEncrypted = walletFromdb.privateKeyHashed;
//     const privateKey = decrypt(privateKeyEncrypted, privateKeyIv);
//     const provider = new ethers.JsonRpcProvider(
//       `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
//     ); // Infura, Alchemy, or your own node
//     const wallet = new ethers.Wallet(privateKey, provider);

//     const tx = await wallet.sendTransaction({
//       to: addressTo,
//       value: ethers.parseEther(amountInEth.toString()),
//     });
//     walletFromdb.balance -= amountInEth;

//     await tx.wait();
//     await user.save();
//     delete req.session.transferCode;
//     delete req.session.walletIdForTransfer;

//     res.status(200).json({ tx });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ error: "Failed to send crypto" });
//   }
// };

const sendPinCode = async (req, res) => {
  const { id } = req.params;
  const { addressTo, amountInEth } = req.body;
  const userId = req.session.userId;

  if (!addressTo || amountInEth === undefined || amountInEth <= 0) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const user = await User.findById(userId);
    const wallet = user.wallets.id(id);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const success = await sendVerificationCode(user.email, code);
    if (!success)
      return res
        .status(500)
        .json({ message: "Failed to send verification code" });

    // Store transfer details in session temporarily
    req.session.transferCode = code;
    req.session.walletIdForTransfer = id;
    req.session.transferDetails = { addressTo, amountInEth };

    res.status(200).json({ message: "Verification code sent" });
  } catch (err) {
    console.error("Request transfer failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendToWallet = async (req, res) => {
  const { id } = req.params;
  const { pinCode } = req.body;
  const userId = req.session.userId;

  if (!pinCode || !req.session.transferDetails) {
    return res
      .status(400)
      .json({ message: "Missing verification or transfer data" });
  }

  if (pinCode !== req.session.transferCode) {
    return res.status(401).json({ message: "Invalid verification code" });
  }

  try {
    const { addressTo, amountInEth } = req.session.transferDetails;
    const user = await User.findById(userId);
    const walletFromdb = user.wallets.id(id);

    if (!walletFromdb)
      return res.status(404).json({ message: "Wallet not found" });

    const privateKey = decrypt(
      walletFromdb.privateKeyHashed,
      walletFromdb.privateKeyIv,
    );
    const provider = new ethers.JsonRpcProvider(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    );
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to: addressTo,
      value: ethers.parseEther(amountInEth.toString()),
    });
    await tx.wait();
    console.log("Before:", walletFromdb.balance);
    walletFromdb.balance -= Number(amountInEth);
    console.log("After:", walletFromdb.balance);
    await user.save();
    await user.save();

    // Cleanup
    delete req.session.transferCode;
    delete req.session.transferDetails;
    delete req.session.walletIdForTransfer;

    return res.status(200).json({ tx });
  } catch (err) {
    console.error("Transfer failed:", err);
    res.status(500).json({ message: "Failed to send crypto" });
  }
};

const getWallet = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(req.session.userId);
    const wallet = user.wallets.id(id);

    res.status(200).json({ wallet });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to fetch wallet" });
  }
};

module.exports = {
  createWallet,
  importWallet,
  revealMnemonic,
  markPhraseSaved,
  sendPinCode,
  sendToWallet,
  getWallet,
  decrypt, // export for usage elsewhere if needed
};
