const express = require("express");
const router = express.Router();

const productsControllers = require("../controller/productsController.js");
const reviewsControllers = require("../controller/reviewsController.js");

router.get("/", productsControllers.getProducts);
router.get("/search", productsControllers.searchProducts);
router.get("/:id", productsControllers.getProductById);

router.post("/:id/reviews", reviewsControllers.leaveReview);
router.get("/:id/reviews", reviewsControllers.getProductReviews);

module.exports = router;
