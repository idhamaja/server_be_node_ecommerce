const express = require("express");
const router = express.Router();
const wishlistController = require("../controller/wishlistController.js");

router.get("/:id/wishlist", wishlistController.getUserWishList);
router.post("/:id/wishlist", wishlistController.addToWishList);
router.delete(
  "/:id/wishlist/:productId",
  wishlistController.removeFromWishList,
);

module.exports = router;