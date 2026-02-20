const { Schema, model } = require("mongoose");

const orderItemShema = Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  selectSize: String,
  selectColor: String,
});

orderItemShema.set("toObject", { virtuals: true });
orderItemShema.set("toJSON", { virtuals: true });

exports.OrderItem = model("OrderItem", orderItemShema);
