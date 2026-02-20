const media_helper = require("../../helpers/media_helper");
const util = require("util");
const { Category } = require("../../models/categoryModel");

exports.addCategories = async function (req, res) {
  try {
    const uploadImage = util.promisify(
      media_helper.upload.fields([{ name: "image", maxCount: 1 }]),
    );
    try {
      await uploadImage(req, res);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        type: error.code,
        message: `${error.message}${err.fields}`,
        storageErrors: error.storageErrors,
      });
    }

    const image = req.files["image"][0];
    if (!image) return res.status(404).json({ message: "No file found" });

    req.body["image"] = `${req.protocol}://${req.get("host")}/${image.path}`;
    let category = new Category(req.body);

    category = category.save();
    if (!category) {
      return res
        .status(500)
        .json({ message: "The category could not be created" });
    }

    return res.status(201).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.editCategories = async function (req, res) {
  try {
    const { name, icon, color } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        icon,
        color,
      },
      { new: true },
    );
    if (!category) {
      return res.status(404).json({ message: "Category is NOT found" });
    }
    return res.json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};

exports.deleteCategories = async function (req, res) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category is NOT found" });
    }
    category.markedForDeletion = true;
    await category.save();
    return res.status(204).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ type: error.name, message: error.message });
  }
};
