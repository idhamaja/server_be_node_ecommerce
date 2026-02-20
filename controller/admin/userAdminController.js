const { User } = require("../../models/user");
const { Order } = require("../../models/orderModel");
const { OrderItem } = require("../../models/orderItemsModel");
const { CartProduct } = require("../../models/cartProductModel");
const { Token } = require("../../models/tokens");

exports.getUsersCount = async function (_, res) {
  try {
    const userCount = await User.countDocuments();
    if (!userCount) {
      return res.status(400).json({ message: "Could not count users" });
    }
    return res.json({ userCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
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
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
