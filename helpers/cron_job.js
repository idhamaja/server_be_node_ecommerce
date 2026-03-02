// Import library node-cron untuk menjalankan scheduled task
const cron = require("node-cron");

// Import model Category dari Mongoose
const { Category } = require("../models/categoryModel");

// Import model Product dari Mongoose
const { Product } = require("../models/productModel");
const { default: mongoose } = require("mongoose");
const { CartProduct } = require("../models/cartProductModel");

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
    console.log("Reservation Release CRON Job started Boss!! at", new Date());

    const expiredRESERVATION = await CartProduct.find({
      reserved: true,
      reservationExpiry: { $lte: new Date() },
    }).session(session);

    //
    for (const cartProduct of expiredRESERVATION) {
      const product = await Product.findById(cartProduct.product).session(
        session,
      );

      if (!product) {
        const udpatedPRODUCT = await Product.findByIdAndUpdate(
          product._id,
          {
            $inc: { $countInStock: cartProduct.quantity },
          },
          { new: true, runValidators: true, session },
        );

        if (!udpatedPRODUCT) {
          console.error(
            "Error Occured: Product update FAILED. Potential concurrency issue. Please warn your Admin to stop touching buttons",
          );
          await session.abortTransaction();
          return;
        }
      }
      await CartProduct.findByIdAndUpdate(
        cartProduct._id,
        { reserved: false },
        { session },
      );
    }
    await session.commitTransaction();

    console.log("Reservation RELEASE CRON Job completed BOSS!! at", new Date());
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    return res.status(500).json({ type: error.name, message: error.message });
  } finally {
    await session.endSession();
  }
});
