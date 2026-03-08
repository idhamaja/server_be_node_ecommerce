exports.buildEmail = (username, order, shippingDetailsUsername) => {
  const orderTemplates = [];

  for (const orderItem of order.orderItems) {
    orderTemplates.push(
      orderItemTemplate(
        orderItem.productImage,
        orderItem.productName,
        orderItem.productPrice,
        orderItem.quantity,
        orderItem.selectedColor,
        orderItem.selectedSize,
      ),
    );
  }

  const orderRows = orderTemplates.join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Order Completed</title>
</head>

<body style="margin:0;background:#f4f4f4;font-family:Arial">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" style="background:#ffffff;margin-top:30px;border-radius:8px">

<tr>
<td style="padding:30px;text-align:center;background:#111;color:#fff">
<h2>Your Order is Confirmed 🎉</h2>
</td>
</tr>

<tr>
<td style="padding:30px">

<p>Hi <strong>${username}</strong>,</p>

<p>
Thank you for your order. Your purchase has been successfully placed and will be processed shortly.
</p>

<h3>Order Summary</h3>

<table width="100%" cellpadding="0" cellspacing="0">
${orderRows}
</table>

<br/>

<table width="100%">
<tr>
<td style="font-size:16px">
<strong>Total:</strong>
</td>

<td align="right" style="font-size:16px">
<strong>$${order.totalPrice}</strong>
</td>
</tr>
</table>

<br/>

<h3>Shipping Address</h3>

<p>
${shippingDetailsUsername.name}<br/>
${shippingDetailsUsername.address}<br/>
${shippingDetailsUsername.city}<br/>
${shippingDetailsUsername.phone}
</p>

<br/>

<p>
If you have any questions, feel free to contact our support team.
</p>

</td>
</tr>

<tr>
<td style="padding:20px;text-align:center;background:#fafafa;font-size:12px;color:#888">
© 2026 Your Store. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;
};
