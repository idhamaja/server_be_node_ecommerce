const { User } = require("../models/user");
const { Product } = require("../models/productModel");
const { default: mongoose } = require("mongoose");

exports.getUserWishList = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User is NOT Found" });
    }

    const wishList = [];

    for (const wishProduct of user.wishList) {
      const product = await Product.findById(wishProduct.productId);
      if (!product) {
        wishList.push({
          ...wishProduct._doc,
          productExists: false,
          prodcutOutOfStock: false,
        });
      } else if (product.countInStock < 1) {
        wishList.push({
          ...wishProduct,
          productExists: true,
          productOutOfStock: true,
        });
      } else {
        wishList.push({
          productId: product._id,
          productImage: product.image,
          productPrice: product.price,
          productName: product.name,
          productExists: true,
          productOutOfStock: false,
        });
      }
    }
    return res.json(wishList);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addToWishList = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User is NOT Founf" });
    }

    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ message: "Product is NOT Found" });
    }

    const productAlreadyExists = user.wishList.find((item) =>
      item.productId.equals(
        new mongoose.Schema.Types.ObjectId(req.body.productIdc),
      ),
    );

    if (productAlreadyExists) {
      return res
        .status(409)
        .json({ message: "Product is already in wishlist" });
    }

    user.wishList.push({
      productId: req.body.productId,
      productImage: product.image,
      productPrice: product.price,
      productName: product.name,
    });

    await user.save();
    return res.status(200).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.removeFromWishList = async function (req, res) {
  try {
    const userId = req.params.id;
    const productId = req.params.productId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User is NOT Found" });
    }

    const index = user.wishList.findIndex((item) =>
      item.productId.equals(new mongoose.Schema.Types.ObjectId(productId)),
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product is NOT in wishlist" });
    }

    user.wishList.splice(index, 1);
    await user.save();
    return res
      .status(204)
      .json({ message: "Product removed from wishlist" })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
