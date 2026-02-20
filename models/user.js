// Import Schema dan model dari mongoose
// Schema = struktur database
// model = representasi collection MongoDB
const { Schema, model } = require("mongoose");

//👉 Ini adalah struktur data User di MongoDB (seperti tabel di SQL).
const userSchema = Schema({
  //  name wajib diisi
  // trim: menghapus spasi di awal dan akhir string
  name: { type: String, required: true, trim: true },

  //validate → validasi custom email
  // validator → fungsi yang mengecek email dengan regex
  // Jika gagal → error "Please enter a valid email address"
  // 👉 Regex ini memastikan format email benar: example@gmail.com
  email: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => {
        const re =
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
        return value.match(re);
      },
      message: "Please enter a valid email address",
    },
  },

  // password disimpan dalam bentuk HASH (bcrypt)
  // bukan password asli demi keamanan
  passwordHash: { type: String, required: true },

  //👉 Semua ini optional (tidak required).
  street: String,
  apartment: String,
  postalCode: String,
  country: String,

  // nomor telepon wajib diisi
  phone: { type: String, required: true, trim: true },

  // false = user biasa
  // true = admin
  isAdmin: { type: Boolean, default: false },

  // kode OTP untuk reset password
  resetPasswordOtp: Number,

  // waktu kadaluarsa OTP
  resetPasswordOtpExpires: Date,

  //CartProduct relasi ke Cart Produk
  cart: [{ type: Schema.Types.ObjectId, ref: "CartProduct" }],

  //Wishlist adalah array produk favorit user.
  // productId → relasi ke Product collection
  // productName, productImage, productPrice → snapshot data produk
  // 👉 Sama seperti cart, supaya harga tidak berubah jika product diupdate.
  wishList: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: { type: String, required: true },
      productImage: { type: String, required: true },
      productPrice: { type: Number, required: true },
    },
  ],
});

userSchema.index({ email: 1 }, { unique: true });
// email harus unik
// tidak boleh ada 2 user dengan email sama

// aktifkan virtuals saat convert ke object
userSchema.set("toObject", { virtuals: true });

// aktifkan virtuals saat convert ke JSON
userSchema.set("toJSON", { virtuals: true });

// membuat collection "users" di MongoDB
// bisa dipakai di controller
exports.User = model("User", userSchema);
