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
