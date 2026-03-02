// Mengimpor library jsonwebtoken untuk decode token JWT
const jwt = require("jsonwebtoken");

// Mengimpor mongoose untuk validasi ObjectId MongoDB
const { default: mongoose } = require("mongoose");

// Middleware async untuk melakukan otorisasi pada request POST
async function authorizePostRequests(req, res, next) {

  // Mengecek apakah method request adalah POST
  // (SEHARUSNYA req.method, bukan res.method)
  // Jika bukan POST, lanjut ke middleware berikutnya
  if (req.method !== "POST") return next();

  // Mengambil base API URL dari environment variable
  const API = process.env.API_URL;

  // Jika endpoint mengarah ke /admin maka dilewati (tidak dicek)
  // Catatan: req.originalUrl (bukan originalURL)
  if (req.originalUrl.startsWith(`${API}/admin`)) return next();

  // Daftar endpoint yang tidak perlu dicek otorisasinya
  const endpointAPI = [
    `${API}/login`,
    `${API}/register`,
    `${API}/forgot-password`,
    `${API}/verify-otp`,
    `${API}/reset-password`,
  ];

  // Mengecek apakah URL yang diakses termasuk dalam daftar pengecualian
  // some() akan mengembalikan true jika salah satu cocok
  const isMatchingEndpointAPI = endpointAPI.some((endpoint) =>
    req.originalUrl.includes(endpoint)
  );

  // Jika endpoint termasuk pengecualian, lanjut tanpa validasi
  if (isMatchingEndpointAPI) return next();

  // Pesan error jika user dalam token tidak sesuai dengan user di request
  const message =
    "User conflict\nThe user making the request doesn't match the user in the request.";

  // Mengambil header Authorization
  const authHeader = req.header("Authorization");

  // Jika tidak ada Authorization header, lanjut (tidak diblokir)
  if (!authHeader) return next();

  // Mengambil token dari format "Bearer <token>"
  const accessToken = authHeader.replace("Bearer", "").trim();

  // Decode token (tanpa verifikasi signature)
  const tokenData = jwt.decode(accessToken);

  // =============================
  // VALIDASI 1: Membandingkan user di body dengan id dalam token
  // =============================

  // Jika request body memiliki field user
  // dan id di token tidak sama dengan user di body
  if (req.body.user && tokenData?.id !== req.body.user) {
    return res.status(401).json({
      message,
    });
  } 

  // =============================
  // VALIDASI 2: Membandingkan user di URL parameter
  // =============================

  // Regex untuk mendeteksi URL dengan pola /users/{id}/
  else if (/\/users\/([^/]+)/.test(req.originalUrl)) {

    // Memecah URL menjadi array berdasarkan "/"
    const parts = req.originalUrl.split("/");

    // Mencari index kata "users" dalam URL
    const usersIndex = parts.indexOf("users");

    // Mengambil id setelah "users"
    const id = parts[usersIndex + 1];

    // Jika id bukan ObjectId MongoDB yang valid, lanjut
    if (!mongoose.isValidObjectId(id)) return next();

    // Jika id pada URL SAMA dengan id di token
    // (LOGIKA INI TERBALIK — seharusnya !==)
    if (tokenData?.id !== id) {
      return res.status(401).json({ message });
    }
  }

  // Jika semua pengecekan lolos, lanjut ke middleware berikutnya
  return next();
}

// Mengekspor middleware agar bisa digunakan di file lain
module.exports = authorizePostRequests;