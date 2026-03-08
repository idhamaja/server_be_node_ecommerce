const express = require("express");
const router = express.Router();

const orderController = require("../controller/orderController");

router.get("/user/:userId", orderController.getUserOrders);
router.get("/:id", orderController.getOrderById);

module.exports = router;
