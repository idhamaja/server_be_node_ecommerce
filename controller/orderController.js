const { default: mongoose } = require("mongoose");
const { User } = require("../models/user");
const { CartProduct } = require("../models/cartProductModel");
const { OrderItem } = require("../models/orderItemsModel");
const { Product } = require("../models/productModel");
const { Order } = require("../models/orderModel");

exports.addOrder = async function (orderData) {
  if (!mongoose.isValidObjectId(orderData.user)) {
    return console.error("User validation failed: Invalid User");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(orderData.user);
    if (!user) {
      await session.abortTransaction();
      return console.trace("Order creation failed: User not found");
    }

    const orderItems = orderData.orderItems;
    const orderItemsIds = [];

    for (const orderItem of orderItems) {
      if (
        !mongoose.isValidObjectId(orderItem.product) ||
        !(await product.findById(orderItem.product))
      ) {
        await session.abortTransaction();
        return console.trace(
          "Order creation failed: Invalid product in the order",
        );
      }

      const cartProduct = await CartProduct.findById(orderItem.cartProductId);
      if (!cartProduct) {
        await session.abortTransaction();
        return console.trace(
          "Order creation failed: Invalid cart product in the order",
        );
      }

      let orderItemModel = await new OrderItem(orderItem).save({ session });
      const product = await Product.findById(orderItem.product);

      if (!orderItemModel) {
        await session.abortTransaction();
        console.trace(
          "Order creation failed:",
          `An order for product "${product.name}" could not be created`,
        );
      }

      if (!cartProduct.reserved) {
        product.countInStock -= orderItemModel.quantity;
        await product.save({ session });
      }

      orderItemsIds.push(orderItemModel._id);

      await cartProduct
        .findByIdAndDelete(orderItem.cartProductId)
        .session(session);
      user.cart.pull(cartProduct.id);
      await user.save({ session });
    }

    orderData["orderItems"] = orderItemsIds;

    let order = new Order(orderData);
    order.status = "processed";
    order.statusHistory.push("processed");

    order = await order.save({ session });

    if (!order) {
      await session.abortTransaction();
      console.trace("Order creation failed: The order could not be created");
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    return console.trace(error);
  } finally {
    await session.endSession();
  }
};

exports.getUserOrders = async function (req, res) {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .select("orderItems status totalPrice dateOrdered")
      .populate({ path: "orderItems", select: "productName, productImage" })
      .sort({ dateOrdered: -1 });

    if (!orders) {
      return res.status(404).json({ message: "Product not found" });
    }

    const completed = [];
    const active = [];
    const cancelled = [];

    for (const order of orders) {
      if (order.status == "delivered") {
        completed.push(order);
      } else if (["cancelled", "expired"].includes(order.status)) {
        cancelled.push(order);
      } else {
        active.push(order);
      }
    }
    return res.json({ total: orders.length, active, completed, cancelled });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, error: error.message });
  }
};

//get order by ID
exports.getOrderById = async function (req, res) {
  try {
    const order = await Order.findById(req, params.id).populate("orderItems");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
