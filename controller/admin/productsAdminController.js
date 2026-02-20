const { Product } = require("../../models/productModel");
const media_helper = require("../../helpers/media_helper");
const { Review } = require("../../models/reviewsModel");
const util = require("util");
const { Category } = require("../../models/categoryModel");
const multer = require("multer");
const { mongoose } = require("mongoose");

exports.getProductsCount = async function (req, res) {
  try {
    const productCount = await Product.countDocuments();
    if (!productCount)
      return res.status(404).json({ message: "No products found" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addProduct = async function (req, res) {
  try {
    const uplaodImage = util.promisify(
      media_helper.upload.fields([
        { name: "image", maxCount: 1 },
        { name: "images", maxCount: 10 },
      ]),
    );
    try {
      await uplaodImage(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        type: error.code,
        message: `${error.message}{${error.field}`,
        storageErrors: error.storageErrors,
      });
    }

    const category = await Category.findById(req.body.category);
    if (!category)
      return res.status(404).json({ message: "Category is NOT found" });
    if (category.markedForDeletion)
      return res.status(400).json({
        message:
          "Category is marked for deletion, you cannot add product to this category",
      });
    const image = req.files["image"][0];
    if (!image) return res.status(404).json({ message: "No file found" });

    req.body.image = `${req.protocol}://${req.get("host")}/${image.path}`;

    const gallery = req.file["images"];
    const imagePaths = [];
    if (gallery) {
      for (const image of gallery) {
        const imagePath = `${req.protocol}://${req.get("host")}/${image.path}`;
        imagePaths.push(imagePath);
      }
    }

    if (imagePaths.length > 0) req.body.images = imagePaths;
    req.body["images"] = imagePaths;

    let product = await new Product(req.body).save();
    if (!product) {
      return res.status(500).json({ message: "The product not be created" });
    }
    return res.status(201).json(product);
  } catch (error) {
    console.error(error);
    if (error instanceof multer.MulterError) {
      return res.status(error.code).json({ message: error.message });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.editProduct = async function (req, res) {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !(await Product.findById(req.params.id))
    ) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category)
        return res.status(404).json({ message: "Category is NOT found" });
      if (category.markedForDeletion)
        return res.status(400).json({
          message:
            "Category is marked for deletion, you cannot add product to this category",
        });

      const product = await Product.findById(req.params.id);

      if (req.body.images) {
        const limit = 10 - product.images.length;

        const uploadGallery = util.promisify(
          media_helper.upload.fields([{ name: "images", maxCount: limit }]),
        );

        try {
          await uploadGallery(req, res);
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            type: error.code,
            message: `${error.message}${error.field ? ` (${error.field})` : ""}`,
            storageErrors: error.storageErrors,
          });
        }
        const imageFiles = req.files["images"];
        const galerryUpdate = imageFiles && imageFiles.length > 0;

        if (galerryUpdate) {
          const imagePath = [];
          for (const image of imageFiles) {
            const imagePathItem = `${req.protocol}://${req.get("host")}/${image.path}`;
            imagePath.push(imagePathItem);
          }
          req.body["images"] = [...product.images, ...imagePath];
        }
      }
      if (req.body.image) {
        const uploadImage = util.promisify(
          media_helper.upload.files([{ name: "image", maxCount: 1 }]),
        );
        try {
          await uploadImage(req, res);
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            type: error.code,
            message: `${error.message}${error.field ? ` (${error.field})` : ""}`,
            storageErrors: error.storageErrors,
          });
        }
        const image = req.files["image"][0];
        if (!image) return res.status(404).json({ message: "No file found" });

        req.body["image"] =
          `${req.protocol}://${req.get("host")}/${image.path}`;
      }
    }

    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updateProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(updateProduct);
  } catch (error) {
    console.error(error);
    if (err instanceof multer.MulterError) {
      return res.status(err.code).json({ message: err.message });
    }
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteProductImages = async function (req, res) {
  try {
    const productId = req.params.id;
    const { deleteImageUrls } = req.body;

    if (
      !mongoose.isValidObjectId(productId) ||
      !Array.isArray(deleteImageUrls)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid product ID or image URLs" });
    }

    await media_helper.deleteImages(deleteImageUrls);
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    product.images = product.images.filter(
      (imageUrl) => !deleteImageUrls.includes(imageUrl),
    );

    await product.save();

    return res.status(204).end();
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`);
    if (error.code === "ENOENT") {
      return res.status(404).json({ message: "One or more images not found" });
    }
    res.status(500).json({
      message: "An error occurred while deleting product images",
      error: error.message,
    });
  }
};

exports.deleteProduct = async function (req, res) {
  try {
    const prodcutId = req.params.id;
    if (!mongoose.isValidObjectId(prodcutId)) {
      return res.status(404).json({ message: "product is not found" });
    }
    const product = await Product.findById(prodcutId);
    if (!product)
      return res.status(404).json({ message: "Product is not found" });
    await media_helper.deleteImages(
      [...product.images, product.image],
      "ENOENT",
    );

    await Review.deleteMany({ _id: { $in: product.reviews } });

    await Product.findByIdAndDelete(prodcutId);
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getProducts = async function (req, res) {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
