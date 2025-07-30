const { transporter } = require("./mailer"); // adjust path

require("dotenv").config();

const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: `"Vaulta Security" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your Vaulta Verification Code",
    text: `Your 6-digit Vaulta verification code is: ${code}`,
    html: `<p>Your 6-digit verification security code is:</p><h2>${code}</h2>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // e.g. "483920"
};

module.exports = {
  sendVerificationCode,
  generateCode,
};
