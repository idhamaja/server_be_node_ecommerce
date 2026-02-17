// Import Schema dan model dari mongoose
const { Schema, model } = require("mongoose");

/**
 * Schema Product
 * Digunakan untuk menyimpan data produk e-commerce
 */
const productSchema = Schema({
  // Nama produk
  name: { type: String, required: true },

  // Deskripsi produk
  description: { type: String, required: true },

  // Harga produk
  price: { type: Number, required: true },

  // Rating rata-rata produk (default 0)
  rating: { type: Number, default: 0.0 },

  // Warna produk (array string)
  colors: [{ type: String }],

  // Gambar utama produk
  image: { type: String, required: true },

  // Banyak gambar tambahan
  images: [{ type: String }],

  // Referensi ke koleksi Review (ObjectId)
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],

  // Jumlah review
  numberOfReviews: { type: Number, default: 0 },

  // Ukuran produk (S, M, L, XL, dll)
  sizes: [{ type: String }],

  // Relasi ke Category
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

  // Gender/age category enum (validasi)
  genderAgeCategory: {
    type: String,
    enum: ["men", "women", "unisex", "kids"],
  },

  // Stock produk (min 0 max 255)
  countInStock: { type: Number, required: true, min: 0, max: 255 },

  // Tanggal produk ditambahkan
  dateAdded: { type: Date, default: Date.now },
});

/**
 * Middleware sebelum save (pre-save hook)
 * Auto hitung rating dan jumlah review
 */
productSchema.pre("save", async function (next) {
  // Jika ada review
  if (this.reviews.length > 0) {
    // Populate review object
    await this.populate("reviews");

    // Hitung total rating semua review
    const totalRating = this.reviews.reduce(
      (acc, review) => acc + review.rating,
      0,
    );

    // Hitung rata-rata rating
    this.rating = totalRating / this.reviews.length;

    // Bulatkan ke 1 angka desimal
    this.rating = parseFloat((totalRating / this.reviews.length).toFixed(1));

    // Simpan jumlah review
    this.numberOfReviews = this.reviews.length;
  }

  next(); // lanjutkan save
});

/**
 * Index untuk fitur search text (MongoDB full-text search)
 */
productSchema.index({ name: "text", description: "text" });

/**
 * Virtual field (tidak disimpan di database)
 */
productSchema.virtual("productInitials").get(function () {
  return this.firstBit + this.secondBit;
});

/**
 * Aktifkan virtual field di JSON dan Object output
 */
productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

// Export model Product
exports.Product = model("Product", productSchema);
