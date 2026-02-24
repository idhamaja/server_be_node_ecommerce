const { User } = require("../models/user");
const { CartProduct } = require("../models/cartProductModel.js");
const { Product } = require("../models/productModel.js");
const { default: mongoose } = require("mongoose");

exports.getUserCart = async function (req, res) {
  try {
    // Cari user berdasarkan ID dari params
    const user = await User.findById(req.params.id);

    // Jika user tidak ditemukan
    if (!user) return res.status(404).json({ message: "User is NOT Found" });

    // Ambil semua CartProduct berdasarkan array id yang ada di user.cart
    const cartProducts = await CartProduct.find({ _id: { $in: user.cart } });

    // ⚠️ find() selalu return array, jadi ini sebenarnya kurang tepat
    if (!cartProducts) {
      return res.status(404).json({ message: "No products in the cart" });
    }

    const cart = []; // Array final yang akan dikirim ke frontend

    // Loop setiap item di cart
    for (const cartProduct of cartProducts) {
      // Cari product asli berdasarkan id yang tersimpan di cartProduct
      const product = await Product.findById(cartProduct.product);

      // Jika product sudah dihapus dari database
      if (!product) {
        cart.push({
          ...cartProduct._doc, // Ambil data cartProduct
          productExists: false, // Tandai produk tidak ada
          productOutOfStock: false,
          product: product,
        });
      } else {
        // Sinkronisasi informasi product terbaru
        cartProduct.productName = product.name;
        cartProduct.productImage = product.image;
        cartProduct.productPrice = product.price;

        // Jika stok kurang dari quantity yang diminta
        if (product.countInStock < cartProduct.quantity) {
          cart.push({
            ...cartProduct._doc,
            productExists: true,
            productOutOfStock: true, // Tandai out of stock
          });
        } else {
          cart.push({
            ...cartProduct._doc,
            productExists: true,
            productOutOfStock: false,
          });
        }
      }
    }

    // Kirim hasil cart ke frontend
    return res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getUserCartCount = async function (req, res) {
  try {
    // Cari user
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "user is NOT Found" });

    // Return jumlah item di cart
    return res.json(user.cart.length);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.getCartProductById = async function (req, res) {
  try {
    // Ambil cart product berdasarkan id
    const cartProduct = await CartProduct.findById(req.params.cartProductId);

    if (!cartProduct)
      return res.status(404).json({ message: "Cart Product is NOT Found" });

    // Ambil product asli
    const product = await Product.findById(cartProduct.product);

    // ⚠️ BUG: cart tidak pernah dideklarasikan
    if (!product)
      cart.push({
        ...cartProduct._doc,
        productExists: false,
        productOutOfStock: false,
      });
    // Update data product terbaru
    else cartProduct.productName = product.name;
    cartProduct.productImage = product.image;
    cartProduct.productPrice = product.price;

    // Cek stok
    if (product.countInStock < cartProduct.quantity)
      cart.push({
        ...cartProduct._doc,
        productExists: true,
        productOutOfStock: true,
      });
    else
      cart.push({
        ...cartProduct._doc,
        productExists: true,
        productOutOfStock: false,
      });

    // Return cartProduct
    return res.json(cartProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.addToCart = async function (req, res) {
  try {
    // Mulai session transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { productId } = req.body;

      // Cari user
      const user = await User.findById(req.params.id);

      // ⚠️ Typo: res.statu
      if (!user) return res.statu(404).json({ message: "User is NOT Found" });

      // Ambil semua cart milik user
      const userCartProducts = await CartProduct.find({
        _id: { $in: user.cart },
      });

      // Cari apakah produk sudah ada di cart
      const existingCartItem = userCartProducts.find(
        (item) =>
          item.product.equals(new mongoose.Schema.Types.ObjectId(productId)) &&
          item.selectedSize === req.body.selectedSize &&
          item.selectedColor === req.body.selectedColor,
      );

      // Ambil product dengan session
      const product = await Product.findById(productId).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Product is NOT Found" });
      }

      // Jika item sudah ada di cart
      if (existingCartItem) {
        let condition = product.countInStock >= existingCartItem.quantity + 1;

        // Jika sudah reserved
        if (existingCartItem.reserved) {
          condition = product.countInStock >= 1;
        }

        if (condition) {
          existingCartItem.quantity += 1;
          await existingCartItem.save({ session });

          // Kurangi stok
          await Product.findByIdAndUpdate(
            { _id: productId },
            { $inc: { countInStock: -1 } },
          ).session(session);

          await session.commitTransaction();
          return res.status(200).json(existingCartItem).end();
        }

        await session.abortTransaction();
        return res.status(400).json({ message: "Not enough stock available" });
      }

      // Jika item baru
      const { quantity, selectSize, selectColor } = req.body;

      const cartProduct = await new CartProduct({
        quantity,
        selectSize,
        selectColor,
        product: productId,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        reserved: true,
      }).save({ session });

      if (!cartProduct) {
        await session.abortTransaction();
        return res
          .status(500)
          .json({ message: "The product could not added to your cart " });
      }

      // Masukkan id cart ke user
      user.cart.push(cartProduct.id);
      await user.save({ session });

      // Kurangi stok sesuai quantity
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          countInStock: { $gte: cartProduct.quantity },
        },
        { $inc: { countInStock: -cartProduct.quantity } },
        { new: true, session },
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Insufficient stock or concurrency issue" });
      }

      await session.commitTransaction();
      return res.status(201).json(cartProduct);
    } catch (error) {
      console.error(error);
      session.abortTransaction();
      return res.status(500).json({ type: error.name, message: error.message });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.modifyProductQuantity = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User is NOT Found" });

    const { quantity } = req.body;

    let cartProduct = await CartProduct.findById(req.params.cartProductId);
    if (!cartProduct)
      return res.status(404).json({ message: "Product is NOT Found" });

    const actualProduct = await Product.findById(cartProduct.product);

    if (!actualProduct)
      return res.status(404).json({ message: "Product does NOT exist" });

    // Cek stok
    if (quantity > actualProduct.countInStock) {
      return res
        .status(400)
        .json({ message: "Insufficient stock for the requested quantity" });
    }

    // ⚠️ Salah format update (harus { quantity: quantity })
    cartProduct = await CartProduct.findByIdAndUpdate(
      req.params.cartProductId,
      quantity,
      { new: true },
    );

    if (!cartProduct)
      return res.status(400).json({ message: "Product is NOT Found" });

    return res.json(cartProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.removeFromCart = async function (req, res) {
  const session = await mongoose.startSession();

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User is NOT Found " });
    }

    if (!user.cart.includes(req.params.cartProductId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Product not in your cart" });
    }

    const cartItemToREMOVE = await CartProduct.findById(
      req.params.cartProductId,
    );

    if (!cartItemToREMOVE) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Cart item is NOT Found" });
    }

    // Jika reserved → harus kembalikan stok
    if (cartItemToREMOVE.reserved) {
      // ⚠️ BUG: _id salah dan variabel cartProduct tidak ada
      const updatedPRODUCT = await Product.findOneAndUpdate(
        {
          _id: cartItemToREMOVE,
          countInStock: { $gte: cartProduct.quantity },
        },
        { $inc: { countInStock: -cartProduct.quantity } },
        { new: true, session },
      );

      if (!updatedPRODUCT) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    // Hapus id dari array user.cart
    user.cart.pull(cartItemToREMOVE.id);
    await user.save({ session });

    // Hapus cartProduct dari database
    const cartProduct = await CartProduct.findByIdAndDelete(
      cartItemToREMOVE.id,
    ).session(session);

    if (!cartProduct) {
      return res.status(500).json({ message: "Internal server error" });
    }

    await session.commitTransaction();
    return res.status(204).end();
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    await session.endSession();
  }
};
