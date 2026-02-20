
const { Order } = require("../../models/orderModel");
const { OrderItem } = require("../../models/productModel");

exports.getOrders = async function (req, res) {
  try {
    const orders = await Order.find()
      .select("-statusHistory")
      .populate("user", "name email")
      .sort({ dateOrdered: -1 })
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          select: "name",
          populate: {
            path: "category",
            select: "name",
          },
        },
      })
      .sort({ dateOrdered: -1 });

    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.getOrdersCount = async function (req, res) {
  try {
    const ordersCount = await Order.countDocuments();
    if (!ordersCount)
      return res.status(404).json({ message: "No orders found" });
    return res.json({ ordersCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
exports.changeOrderStatus = async function (req, res) {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.statusHistory.includes(newStatus)) {
      order.statusHistory.push(order.status);
    }
    order.status = newStatus;
    order = await order.save();
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteOrder = async function (req, res) {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    for (const orderItemId of order.orderItems) {
      await OrderItem.findByIdAndDelete(orderItemId);
    }
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
