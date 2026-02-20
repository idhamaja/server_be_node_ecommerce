const express = require("express");
const router = express.Router();

const userController = require("../controller/admin/userAdminController");
const categoriesController = require("../controller/admin/categoriesAdminController");
const ordersController = require("../controller/admin/ordersAdminController");
const productsController = require("../controller/admin/productsAdminController");

//USERS ROUTES
router.get("/users/count", userController.getUsersCount);
router.delete("/users/:id", userController.deleteUser);

//CATEGORY ROUTES
router.post("/categories", categoriesController.addCategories);
router.put("/categories/:id", categoriesController.editCategories);
router.delete("/categories/:id", categoriesController.deleteCategories);

//PRODUCTS ROUTES
router.get("/products/count", productsController.getProductsCount);
router.get("/products", productsController.getProducts);
router.post("/products", productsController.addProduct);
router.put("/products/:id", productsController.editProduct);
router.delete("/products/:id/images", productsController.deleteProductImages);
router.delete("/products/:id", productsController.deleteProduct);

//ORDERS ROUTES
router.get("/orders", ordersController.getOrders);
router.get("/orders/count", ordersController.getOrdersCount);
router.put("/orders/:id", ordersController.changeOrderStatus);
router.delete("/orders/:id", ordersController.deleteOrder);

module.exports = router;
