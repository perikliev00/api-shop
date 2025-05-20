const express = require('express');
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/isAuth');
const router = express.Router();

// GET /api/shop/products
router.get('/products', shopController.getProducts);

// GET /api/shop/products/:productId
router.get('/products/:productId', shopController.getProduct);

// GET /api/shop/cart
router.get('/cart', shopController.getCart);

// POST /api/shop/cart
router.post('/cart', isAuth, shopController.postCart);

// DELETE /api/shop/cart/:productId
router.delete('/cart/:productId', isAuth, shopController.deleteCartProduct);

// POST /api/shop/orders
router.post('/ordersPost', isAuth, shopController.createOrder);

// GET /api/shop/orders
router.get('/orders', isAuth, shopController.getOrders);

// GET /api/shop/orders/:orderId
router.get('/orders/:orderId', isAuth, shopController.getOrderById);

module.exports = router;
