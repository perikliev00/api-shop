const { validationResult } = require('express-validator');
const Product = require('../models/product');

// GET /admin/add-product (Not needed for API. If you want, respond with info)
exports.getAddProduct = (req, res, next) => {
  res.json({
    success: true,
    message: "Use POST /admin/add-product to add a product. Send JSON { title, imageUrl, price, description }"
  });
};

// GET /admin/products
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/add-product
exports.postAddProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  const { title, imageUrl, price, description } = req.body;
  try {
    const product = new Product({
      title,
      imageUrl,
      price,
      description,
      userId: req.user._id
    });
    await product.save();
    res.status(201).json({ success: true, message: "Product added!", data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /admin/edit-product/:productId (Return product data for editing in frontend)
exports.getEditProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/edit-product (Update product)
exports.postEditProduct = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  const { productId, title, imageUrl, price, description } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    product.title = title;
    product.imageUrl = imageUrl;
    product.price = price;
    product.description = description;
    await product.save();
    res.json({ success: true, message: "Product updated!", data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /admin/product/:productId
exports.deleteProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  try {
    const product = await Product.findOneAndDelete({
      _id: prodId,
      userId: req.user._id
    });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found or not authorized" });
    }
    res.json({ success: true, message: "Product deleted!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
