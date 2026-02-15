const { validationResult } = require("express-validator");
const { User } = require("../models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Token } = require("../models/tokens.js");
const mailSender = require("../helpers/email_sender.js");
const crypto = require("crypto");

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

exports.forgotPassword = async function (req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with that email does NOT exist!" });
    }
    const OTP = Math.floor(1000 + Math.random() * 9000);

    user.resetPasswordOtp = OTP;
    user.resetPasswordOtpExpires = Date.now() + 600000;

    await user.save();

    //Send the EMAIL
    const response = await mailSender.sendMail(
      email,
      "Password reset OTP",
      `Your OTP for password reset is: ${OTP}`,
    );

    return res.json({ message: response });
  } catch (error) {
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.verifyPasswordResetOTP = async function (req, res) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!email) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      user.resetPasswordOtp !== +otp ||
      Date.now() > user.resetPasswordOtpExpires
    ) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }
    user.resetPasswordOtp = 1;
    user.resetPasswordOtpExpires = undefined;

    await user.save();
    return res.json({ message: "OTP confirmed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.resetPassword = async function (req, res) {};
