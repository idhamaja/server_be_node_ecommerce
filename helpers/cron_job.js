// Import library node-cron untuk menjalankan scheduled task
const cron = require("node-cron");

// Import model Category dari Mongoose
const { Category } = require("../models/categoryModel");

// Import model Product dari Mongoose
const { Product } = require("../models/productModel");
const { default: mongoose } = require("mongoose");

// Menjadwalkan cron job setiap hari jam 00:00
cron.schedule("0 0 * * * ", async function () {
  try {
    // Mencari semua kategori yang ditandai untuk dihapus
    const categoriesToBeDeleted = await Category.find({
      markedForDeletion: true,
    });

    // Loop setiap kategori yang ditemukan
    for (const category of categoriesToBeDeleted) {
      // Menghitung jumlah produk yang masih menggunakan kategori tersebut
      const categoryProductsCount = await Product.countDocuments({
        category: category.id,
      });

      // Jika tidak ada produk yang menggunakan kategori tersebut
      // maka kategori akan dihapus dari database
      if (categoryProductsCount < 1) await category.deleteOne();
    }

    // Menampilkan log sukses jika cron berhasil dijalankan
    console.log("CRON job executed successfully at", new Date());
  } catch (error) {
    // Menampilkan pesan error jika terjadi kegagalan
    console.error("CRON job error", error);
  }
});

cron.schedule("*30 * * * *", async function () {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    await session.endSession();
  }
});
