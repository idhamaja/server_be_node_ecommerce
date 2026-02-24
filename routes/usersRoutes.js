const express = require("express");
const router = express.Router();

const userController = require("../controller/usersControllers.js");
const wishlistController = require("../controller/wishlistController.js");
const cartController = require("../controller/cartController.js");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);

//wishlist
router.get("/:id/wishlist", wishlistController.getUserWishList);
router.post("/:id/wishlist", wishlistController.addToWishList);

router.delete(
  "/:id/wishlist/:productId",
  wishlistController.removeFromWishList,
);

//cart
router.get("/:id/cart", cartController.getUserCart);
router.get("/:id/cart/count", cartController.getUserCartCount);
router.get("/:id/cart/cartProductId", cartController.getCartProductById);
router.post("/:id/cart", cartController.addToCart);
router.put("/:id/cart/:cartProductId", cartController.modifyProductQuantity);
router.delete("/:id/cart/:cartProductId", cartController.removeFromCart);

module.exports = router;
