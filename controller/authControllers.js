const { validationResult } = require("express-validator");
const { User } = require("../models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Token } = require("../models/tokens.js");
const mailSender = require("../helpers/email_sender.js");
const crypto = require("crypto");
const { error } = require("console");

exports.register = async function (req, res) {
  const regisErrors = validationResult(req);

  //check if registration is empty or erro in CLIENT side
  if (!regisErrors.isEmpty()) {
    const errorMessages = regisErrors.array().map((errorMessages) => ({
      field: errorMessages.path,
      message: errorMessages.msg,
    }));
    return res.status(400).json({ regisErrors: errorMessages });
  }
  try {
    //password wtih encrypt or hash
    let userRegist = new User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 8),
    });

    //check if account regist CREATED or new data to the Databse
    userRegist = await userRegist.save();

    //check if account regist empty or error in SERVER side
    if (!userRegist) {
      return res.status(500).json({
        type: "Internal Server Error",
        message: "Could not create new user",
      });
    }

    return res.status(201).json(userRegist);
  } catch (errorMsg) {
    //check if account regist has DUPLICATE account
    if (errorMsg.message.includes("email_1 dup key")) {
      return res.status(409).json({
        type: "AuthError",
        message: "User with that Email already exists",
      });
    }
    return res
      .status(500)
      .json({ type: errorMsg.name, message: errorMsg.message });
  }
};

exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;

    //user email try one ID
    const user = await User.findOne({
      email,
    });

    //check if user Login has not FOUND
    if (!user) {
      return res
        .status(404)
        .json({ message: "User has not found\nCheck again your Email" });
    }

    //check if comparisson password match of the user
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    //access token JWT initiate
    const accessToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" },
    );

    //refresh token JWT initiate
    const refreshToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "60d",
      },
    );

    const token = await Token.findOne({ userId: user.id });

    //check delete token by one account
    if (token) await token.deleteOne();
    await new Token({
      userId: user.id,
      accessToken,
      refreshToken,
    }).save();

    user.passwordHash = undefined;
    return res.json({ ...user.doc, user, accessToken, refreshToken });
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.verifyToken = async function (req, res) {
  try {
    let accessToken = req.headers.authorization;
    if (!accessToken) return res.json(false);
    accessToken = accessToken.replace("Bearer", "").trim();

    const token = await Token.findOne({ accessToken });
    if (!token) return res.json(false);

    const tokenData = jwt.decode(token.refreshToken);

    const user = await User.findById(tokenData.id);
    if (!user) return res.json(false);

    const verifyIsValid = jwt.verify(
      tokenVerify.refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    //if verify token is NOT VALID
    if (!verifyIsValid) return res.json(false);

    //if verify token is VALID
    return res.json(true);
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//Fungsi ini dipanggil saat user klik Forgot Password dan memasukkan email.
exports.forgotPassword = async function (req, res) {
  try {
    //Ambil email dari request body (frontend kirim email).
    const { email } = req.body;

    //Cari user di database berdasarkan email.
    const user = await User.findOne({ email });

    //Jika email tidak ada di database → kirim error 404.
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with that email does NOT exist!" });
    }

    //Generate OTP 4 digit random (1000–9999).
    const OTP = Math.floor(1000 + Math.random() * 9000);

    //📌 Simpan OTP ke database
    //📌 Set expired time = 10 menit (600000 ms)
    user.resetPasswordOtp = OTP;
    user.resetPasswordOtpExpires = Date.now() + 600000;

    //Simpan perubahan ke MongoDB.
    await user.save();

    //Kirim OTP ke email user menggunakan nodemailer.
    const response = await mailSender.sendMail(
      email,
      "Password reset OTP",
      `Your OTP for password reset is: ${OTP}`,
    );

    //Kirim response ke frontend.
    return res.json({ message: response });
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//Fungsi ini dipanggil saat user memasukkan OTP.
exports.verifyPasswordResetOTP = async function (req, res) {
  try {
    //Ambil email dan OTP dari frontend.
    const { email, otp } = req.body;

    //Cari user di database.
    const user = await User.findOne({ email });

    //jika email tidak ditemukan
    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    //Validasi OTP:OTP tidak sama atau sudah expired
    if (
      user.resetPasswordOtp !== +otp ||
      Date.now() > user.resetPasswordOtpExpires
    ) {
      //OTP salah atau expired.
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    //📌 Tandai OTP sudah diverifikasi Nilai 1 berarti OTP confirmed.
    user.resetPasswordOtp = 1;
    user.resetPasswordOtpExpires = undefined;

    //OTP berhasil diverifikasi.
    await user.save();
    return res.json({ message: "OTP confirmed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

//Dipanggil setelah OTP sukses diverifikasi.
exports.resetPassword = async function (req, res) {
  //check validation password
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    return res.status(400).json({ errors: errorMessage });
  }

  try {
    //check mencari email user
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    //check if user not found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //check reset password
    //Pastikan OTP sudah diverifikasi
    if (user.resetPasswordOtp !== 1) {
      return res
        .status(401)
        .json({ message: "Confirm OTP before resetting password" });
    }

    //reset the actual password
    //Hash password baru
    user.passwordHash = bcrypt.hashSync(newPassword, 8);

    //Reset OTP field
    user.resetPasswordOtp = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
