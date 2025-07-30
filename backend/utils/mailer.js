// mailer.js or utils/sendMail.ts
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // your Gmail address
    pass: process.env.MAIL_PASS, // Gmail App Password (not your real Gmail password)
  },
});

module.exports = {
  transporter,
};
