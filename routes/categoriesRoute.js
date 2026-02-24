const express = require("express");
const router = express.Router();
const categoriesController = require("../controller/admin/categoriesAdminController");

router.get("/", categoriesController.getCategories);
router.get("/:id", categoriesController.getCategoryById);

module.exports = router;