const router = express().Router();

const productsControllers = require("../controller/productsController.js");

router.get("/:id", (req, res) => {});
router.get("/products/count", productsControllers.getProductsCount);
router.delete("/products/:id");
router.put("/products/:id");

module.exports = router;
