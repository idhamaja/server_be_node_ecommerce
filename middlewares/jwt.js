//express-jwt → middleware untuk validasi JWT otomatis.
//Token → model MongoDB untuk menyimpan token user (biasanya refresh/access token)
const { expressjwt: expJwt } = require("express-jwt");
const { Token } = require("../models/tokens.js");

//Fungsi ini mengembalikan middleware Express.
function authJwt() {
  //Ambil base API URL dari .env
  const API = process.env.API_URL;

  //konfigurasi JWT Middleware
  //Parameter -> Fungsi
  //secret -> Secret key untuk verify JWT
  //algorithms -> Algoritma hashing JWT
  //isRevoke -> Callback untuk cek token revoked
  // Semua route di bawah ini TIDAK PERLU LOGIN
  return expJwt({
    secret: process.env.ACCESS_TOKEN_SECRET,
    algorithms: ["HS256"],
    isRevoked: isRevoked,
  }).unless({
    path: [
      `${API}/login`,
      `${API}/login/`,

      `${API}/register`,
      `${API}/register/`,

      `${API}/forgot-password`,
      `${API}/forgot-password/`,

      `${API}/verify-otp`,
      `${API}/verify-otp/`,

      `${API}/reset-password`,
      `${API}/reset-password/`,
    ],
  });
}

//Fungsi ini dipanggil otomatis untuk cek apakah token revoked atau unauthorized.
async function isRevoked(req, jwt) {
  //Ambil Authorization Header
  const authHeader = req.header("Authorization");

  //true = token revoked → request ditolak.
  if (!authHeader.startsWith("Bearer ")) {
    return true;
  }

  //➡ Hapus "Bearer"
  //➡ Ambil token asli.
  const accessToken = authHeader.replace("Bearer", "").trim();

  //Jika token tidak ada → dianggap logout / expired.
  const token = await Token.findOne({ accessToken });

  //Regex untuk mendeteksi URL admin: contoh
  // /api/v1/admin/create-user
  // /api/v1/admin/delete-user
  const adminRouteRegex = /^\/api\/v1\/admin\//i;

  //Kondisi	Artinya
  //!jwt.payload.isAdmin -> User bukan admin
  // adminRouteRegex.test(req.originalUrl) -> Akses route admin
  //adminFault -> User non-admin akses admin route
  const adminFault =
    !jwt.payload.isAdmin && adminRouteRegex.test(req.originalUrl);

  //Kondisi	           Result
  //adminFault true ->	Token revoked
  //token tidak ditemukan ->	Token revoked
  //Semua valid ->	Token accepted
  return adminFault || !token;
}

module.exports = authJwt;
