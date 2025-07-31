require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ethers = require("ethers");
const cors = require("cors");
const User = require("./models/User");
const axios = require("axios");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const notisRoutes = require("./routes/notisRoutes");
const walletRoutes = require("./routes/walletRoutes");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your React app's address
    credentials: true, // allow cookies/session
  }),
);
app.use(express.json());
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
    },
  }),
);

connectDB();

app.use("/auth", userRoutes);
app.use("/notifications", notisRoutes);
app.use("/wallet", walletRoutes);

const provider = new ethers.JsonRpcProvider(
  // `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
);

let cachedEthPrice = null;
let lastFetchTime = 0;

async function getEthPriceUSD() {
  const now = Date.now();
  if (cachedEthPrice && now - lastFetchTime < 60 * 1000) {
    return cachedEthPrice;
  }

  try {
    const res = await axios.get(process.env.COINGECKO_API_URL);
    cachedEthPrice = res.data.ethereum.usd;
    lastFetchTime = now;
    return cachedEthPrice;
  } catch (err) {
    console.error(
      "Failed to fetch ETH price:",
      err.response?.data || err.message,
    );
    return 0; // fallback
  }
}

provider.on("block", async (blockNumber) => {
  console.log(`Checking block ${blockNumber}`);

  const users = await User.find();
  const ethPrice = await getEthPriceUSD();

  const block = await provider.getBlock(blockNumber, true);
  const transactions = block.transactions;

  console.log(`Block ${blockNumber} contains ${transactions.length} txs`);

  for (const user of users) {
    for (const wallet of user.wallets) {
      if (wallet.type === "ethereum") {
        const address = wallet.address.toLowerCase();
        const balanceWei = await provider.getBalance(address);
        const ethBalance = parseFloat(ethers.formatEther(balanceWei));
        const oldBalance = parseFloat(wallet.balance || 0);

        console.log(
          `Wallet ${address} on-chain balance: ${ethBalance}, stored: ${oldBalance}`,
        );

        // Only continue if balance increased
        if (ethBalance > oldBalance) {
          console.log(`🔔 New ETH received by ${address}`);

          console.log(
            `Block ${blockNumber} has ${transactions.length} transactions`,
          );

          for (const tx of transactions) {
            const fullTx = await provider.getTransaction(tx);
            if (
              fullTx &&
              fullTx.to &&
              fullTx.to.toLowerCase() === address.toLowerCase()
            ) {
              // Only show transactions where value > 0
              if (fullTx.value > 0n) {
                console.log("=== Incoming Transaction ===");
                console.log(fullTx);
                console.log("Valid");
                const ethAmount = parseFloat(ethers.formatEther(fullTx.value));
                console.log(`This is the ethAmount: ${ethAmount}`);

                const txHashExists = wallet.transactions.some(
                  (t) => t.txHash === fullTx.hash,
                );
                if (txHashExists) continue;

                const asset = {
                  symbol: "ETH",
                  name: "Ethereum",
                  txHash: fullTx.hash,
                  from: fullTx.from,
                  contractAddress: "native",
                  balance: ethAmount,
                  decimals: 18,
                  isNative: true,
                  usdBalance: ethAmount * ethPrice,
                };
                const notis = {
                  title: "Deposit Received",
                  message: `You just received ${ethAmount} ETH from ${fullTx.from.slice(0, 6)}...${fullTx.from.slice(-4)} to your wallet ${fullTx.to.slice(0, 6)}...${fullTx.to.slice(-4)}.`,
                  type: "TRANSACTION",
                  status: "UNREAD",
                  timestamp: new Date().toISOString(),
                };

                const transaction = {
                  amount: ethAmount,
                  from: fullTx.from,
                  txHash: fullTx.hash,
                  status: "SUCCESS",
                  timestamp: new Date(),
                };

                wallet.assets.push(asset);
                wallet.transactions.push(transaction);
                user.notifications.push(notis);
                user.transactions.push(transaction);

                console.log(`✅ Recorded ETH incoming tx: ${tx.hash}`);
                // console.log({
                //   hash: fullTx.hash,
                //   from: fullTx.from,
                //   to: fullTx.to,
                //   value: ethers.formatEther(fullTx.value), // human-readable ETH
                //   gasPrice: ethers.formatUnits(fullTx.gasPrice, "gwei"),
                //   nonce: fullTx.nonce,
                //   data: fullTx.data,
                // });
              }
            }
            // 0xf9371D26A28047d42A28EF2fF50A0636c85a6dBA
          }

          wallet.balance = ethBalance.toFixed(6);
          const totalBalanceETH = wallet.assets.reduce(
            (sum, a) => sum + a.balance,
            0,
          );
          const totalBalanceUSD = wallet.assets.reduce(
            (sum, a) => sum + a.usdBalance,
            0,
          );

          wallet.totalBalance = totalBalanceUSD;
          await user.save({
            validateBeforeSave: true,
            optimisticConcurrency: false,
          });

          console.log(
            `✅ Updated user: ${user.username}, ETH: ${totalBalanceETH}, USD: ${totalBalanceUSD}`,
          );
        }
      }
    }
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
