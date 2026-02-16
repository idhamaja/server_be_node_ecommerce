const express = require("express");
const router = express.Router();

const userController = require("../controller/usersControllers.js");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);

module.exports = router;
