// Mengambil model Product dari file productModel
const { Product } = require("../models/productModel.js");

// ===============================
// GET ALL PRODUCTS + FILTER + PAGINATION
// ===============================
exports.getProducts = async function (req, res) {
  try {
    let products; // Variable untuk menyimpan hasil query

    // Ambil nomor halaman dari query URL (?page=2), default = 1
    const page = req.query.page || 1;

    // Jumlah data per halaman
    const pageSize = 10;

    // Jika ada filter criteria di URL
    if (req.query.criteria) {
      let query = {}; // Object query MongoDB

      // Jika ada filter category
      if (req.query.category) {
        query["category"] = req.query.category; // Tambahkan filter category
      }

      // Switch berdasarkan criteria
      switch (req.query.criteria) {
        case "newArrivals": {
          // Ambil tanggal 14 hari yang lalu
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

          // Filter produk yang ditambahkan 14 hari terakhir
          query["dateAdded"] = { $gte: twoWeeksAgo };
          break;
        }

        case "popular": {
          // Filter produk dengan rating minimal 4.5
          query["rating"] = { $gte: 4.5 };
          break;
        }

        default:
          break;
      }

      // Jalankan query dengan filter + pagination
      products = await Product.find(query)
        .select("-images -reviews -size") // Tidak tampilkan field ini
        .skip((page - 1) * pageSize) // Lewati data sebelumnya
        .limit(pageSize); // Batasi jumlah data
    }

    // Jika hanya ada category tanpa criteria
    else if (req.query.category) {
      products = await Product.find({ category: req.query.category })
        .select("-images -reviews -size")
        .skip((page - 1) * pageSize)
        .limit(pageSize);
    }

    // Jika tidak ada filter sama sekali
    else {
      // ⚠️ Versi asli kamu salah di sini (select tidak chaining)
      products = await Product.find()
        .select("-images -reviews -size")
        .skip((page - 1) * pageSize)
        .limit(pageSize);
    }

    // Jika tidak ada produk ditemukan
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "Products is NOT Found" });
    }

    // Kirim hasil ke client
    return res.json(products);
  } catch (error) {
    // Jika terjadi error server
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

// ===============================
// GET PRODUCT BY ID
// ===============================
exports.getProductById = async function (req, res) {
  try {
    // Cari product berdasarkan ID dari params
    const product = await Product.findById(req.params.id).select("-reviews"); // Jangan tampilkan reviews

    // Jika tidak ditemukan
    if (!product) {
      return res.status(404).json({ message: "Product is NOT Found" });
    }

    // Kirim data product
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

// ===============================
// SEARCH PRODUCTS
// ===============================
exports.searchProducts = async function (req, res) {
  try {
    // Ambil keyword pencarian (?q=shoe)
    const searchItemProducts = req.query.q;

    const page = req.query.page || 1;
    const pageSize = 10;

    let query = {}; // Object query MongoDB

    // Jika ada category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Jika ada genderAgeCategory
    if (req.query.genderAgeCategory) {
      query.genderAgeCategory = req.query.genderAgeCategory.toLowerCase();
    }

    // Jika ada keyword pencarian
    if (searchItemProducts) {
      query.$text = {
        $search: searchItemProducts, // Keyword yang dicari
        $language: "english", // Bahasa text index
        $caseSensitive: false, // Tidak sensitif huruf besar/kecil
      };
    }

    // Jalankan query
    const searchResults = await Product.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // Jika tidak ditemukan
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Kirim hasil ke client
    return res.json(searchResults);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
