const app = require("express");
const router = app.Router();
const authController = require("../controller/authControllers.js");
const { body } = require("express-validator");
const validateUser = [
  body("name").not().isEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isStrongPassword()
    .withMessage(
      "Password must contain at least one uppercase, one lowercase and one symbol.",
    ),
  body("phone")
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
];

router.post("/login", authController.login);
router.post("/register", validateUser, authController.register);
router.get("/verify_token", authController.verifyToken);
router.post("/forgot_password", authController.forgotPassword);
router.post("/verify_otp", authController.verifyPasswordResetOTP);
router.post("/reset_password", authController.resetPassword);

module.exports = router;
