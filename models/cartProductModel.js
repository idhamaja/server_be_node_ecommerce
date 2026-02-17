//👉 Mengambil Schema dan model dari library mongoose.
//Schema → untuk mendefinisikan struktur data MongoDB
//model → untuk membuat model MongoDB dari schema
const { Schema, model } = require("mongoose");

//👉 Ini adalah blueprint (struktur) data produk di keranjang belanja (cart).
const cartProductSchema = Schema({
  //ObjectId → menyimpan ID dari koleksi lain
  //ref: "Product" → relasi ke model Product (populate bisa dipakai) required: true → wajib ada
  //Artinya: setiap item cart terhubung ke produk asli di database.
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

  //Menyimpan jumlah produk
  // Default = 1 jika tidak dikirim
  quantity: { type: Number, default: 1 },

  //Menyimpan ukuran dan warna yang dipilih user.
  selectedSize: String,
  selectedColor: String,

  //⚠️ Ini penting:
  // Ini bukan data asli dari Product, tapi snapshot (salinan) saat produk dimasukkan ke cart.
  // Kenapa disimpan lagi?
  // Kalau harga produk berubah di database, cart user tetap konsisten
  // Menghindari query populate berulang dan untuk Meningkatkan performa
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: String, required: true },

  //👉 Menyimpan waktu kadaluarsa reservasi produk di cart.
  reservationExpiry: {
    type: Date,
    //Jadi produk di cart hanya “dibooking” selama 30 menit.
    default: () => new Date(Date.now() + 30 * 60 * 1000),
  },

  //true → produk sedang direservasi di cart
  // false → sudah expired atau checkout
  reserved: { type: Boolean, default: true },
});

//👉 Memastikan field virtual muncul saat:
//.toJSON()
//.toObject()
//📌 Biasanya untuk virtual field seperti id tanpa _id
cartProductSchema.set("toObject", { virtuals: true });
cartProductSchema.set("toJSON", { virtuals: true });

//👉 Membuat model MongoDB bernama CartProduct dan bisa dipakai di controller.
exports.CartProduct = model("CartProduct", cartProductSchema);
