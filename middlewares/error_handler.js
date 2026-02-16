const jwt = require("jsonwebtoken");
const { Token } = require("../models/tokens");
const { User } = require("../models/user");

async function errorHandler(error, req, res, next) {
  if (error.name === "Unauthorized") {
    if (!error.message.includes("jwt expired")) {
      return res
        .status(error.status)
        .json({ type: error.name, message: error.message });
    }
    try {
      const tokenHeader = req.header("Authorization");
      const accessToken = tokenHeader?.split(" ")[1];

      const token = await Token.findOne({
        accessToken,
        refreshToken: { $exists: true },
      });

      //if token is NOT Null
      if (!token) {
        return res
          .status(401)
          .json({ type: "Unauthorized", message: "Token does not exist" });
      }

      const userData = jwt.verify(
        token.refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );

      const user = await User.findById(userData.id);

      //if there's no User
      if (!user) {
        return res.status(401).json({ message: "Invalid user " });
      }

      const newAccessToken = jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" },
      );

      req.headers["Authorization"] = `Bearer ${newAccessToken}`;

      await Token.updateOne(
        { _id: token.id },
        { accessToken: newAccessToken },
      ).exec();

      res.set("Authorization", `Bearer ${newAccessToken}`);

      return next();
    } catch (refresError) {
      return res
        .status(401)
        .json({ type: "Unauthorized", message: refresError.message });
    }
  }
  return res
    .status(error.status)
    .json({ type: error.name, message: error.message });
}

module.exports = errorHandler;
