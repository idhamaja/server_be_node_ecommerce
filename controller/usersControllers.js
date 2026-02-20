const { User } = require("../models/user");

/**
 * GET /users
 * Ambil semua user (admin only)
 */
exports.getUsers = async (req, res) => {
  try {
    // Ambil semua user, hanya select field tertentu
    const users = await User.find().select("name email id isAdmin");

    // Jika tidak ada user
    if (!users) {
      return res.status(404).json({ message: "User is not found" });
    }

    return res.json(users);
  } catch (error) {
    console.error(error);

    // Error server
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

/**
 * GET /users/:id
 * Ambil user berdasarkan ID
 */
exports.getUserById = async (req, res) => {
  try {
    // Cari user berdasarkan ID dan sembunyikan field sensitif
    const user = await User.findById(req.params.id).select(
      "-passwordHash -resetPasswordOtp -resetPasswordOtpExpires",
    );

    if (!user) {
      return res.status(404).json({ message: "User is not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

/**
 * PUT /users/:id
 * Update data user
 */
exports.updateUser = async (req, res) => {
  try {
    // Ambil data dari body request
    const { name, email, phoneNumber } = req.body;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phoneNumber,
      },
      { new: true }, // return data baru
    );

    if (!user) {
      return res.status(404).json({ message: "User is Not Found" });
    }

    // Hapus password dari response
    user.passwordHash = undefined;

    user.cart = undefined;

    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.deleteUser = async function (req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User is not FOUND" });

    const orders = await Order.find({ user: userId });
    const orderItemIds = orders.flatMap((order) => order.orderItem);

    await Order.deleteMany({ user: userId });
    await OrderItem.deleteMany({ _id: { $in: orderItemIds } });

    await CartProduct.deleteMany({ _id: { $in: user.cart } });

    await User.findByIdAndUpdate(userId, {
      $pull: { cart: { $exists: true } },
    });

    await Token.deleteOne({ userId: userId });
    await User.deleteOne({ _id: userId });
    
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
