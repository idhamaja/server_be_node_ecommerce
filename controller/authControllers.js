const { validationResult } = require("express-validator");
const { User } = require("../models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Token } = require("../models/tokens.js");

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
exports.verifyToken = async function (req, res) {};
exports.forgotPassword = async function (req, res) {};
exports.verifyPasswordResetOTP = async function (req, res) {};
exports.resetPassword = async function (req, res) {};
