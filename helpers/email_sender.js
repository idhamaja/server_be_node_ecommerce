const nodemailer = require("nodemailer");

exports.sendMail = async (email, subject, body) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.EMAIL}>`,
    to: email,
    subject: subject,
    text: body,
  });

  return "Email sent successfully";
};
