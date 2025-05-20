const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const fs = require('fs');
const PDFDocument = require('pdfkit');
// const stripe = require('stripe')(process.env.STRIPE_KEY);

const ITEMS_PER_PAGE = 1;

// GET /api/shop/products
exports.getProducts = async (req, res, next) => {
    const page = +req.query.page || 1;
    try {
        const totalItems = await Product.countDocuments();
        const products = await Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        res.json({
            success: true,
            data: products,
            meta: {
                currentPage: page,
                totalItems,
                totalPages: Math.ceil(totalItems / ITEMS_PER_PAGE),
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/shop/products/:productId
exports.getProduct = async (req, res, next) => {
    const prodId = req.params.productId;
    try {
        const product = await Product.findById(prodId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/shop/cart
exports.getCart = async (req, res, next) => {
    try {
        // Step 1: Get user and cart items
        const user = await User.findById(req.user._id);
        const cartItems = user.cart.items;

        // Step 2: Gather product IDs from cart
        const productIds = cartItems.map(item => item.productId);

        // Step 3: Query all products in the cart at once
        const products = await Product.find({ _id: { $in: productIds } });

        // Step 4: Map cart items to product details
        const cartDetails = cartItems.map(item => {
            const product = products.find(
                p => p._id.toString() === item.productId.toString()
            );
            return {
                product: product ? product.toObject() : null,
                quantity: item.quantity
            };
        });

        res.json({ success: true, data: cartDetails });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/shop/cart
exports.postCart = async (req, res, next) => {
    const prodId = req.body.productId;
    try {
        const product = await Product.findById(prodId);
        const user = await User.findById(req.user._id);
        await user.addToCart(product);
        res.json({ success: true, message: 'Product added to cart' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/shop/cart/:productId
exports.deleteCartProduct = async (req, res, next) => {
    const prodId = req.params.productId;
    try {
        const user = await User.findById(req.user._id);
        await user.removeFromCart(prodId);
        res.json({ success: true, message: 'Product removed from cart' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/shop/orders
exports.createOrder = async (req, res, next) => {
    try {
        // Step 1: Get user and cart items
        const user = await User.findById(req.user._id);
        const cartItems = user.cart.items;

        // Step 2: Gather product IDs and query products
        const productIds = cartItems.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } });

        // Step 3: Map cart items to product details for order
        const orderProducts = cartItems.map(item => {
            const product = products.find(
                p => p._id.toString() === item.productId.toString()
            );
            return {
                quantity: item.quantity,
                product: product ? product.toObject() : null
            };
        });

        // Step 4: Create and save order
        const order = new Order({
            user: { email: user.email, userId: user._id },
            products: orderProducts
        });
        await order.save();

        // Step 5: Clear cart
        await user.clearCart();

        res.json({ success: true, message: 'Order placed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/shop/orders
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ 'user.userId': req.user._id });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/shop/orders/:orderId (fetch order by ID)
exports.getOrderById = async (req, res, next) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        // Only the owner can access
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/shop/orders/:orderId/invoice (PDF streaming)
exports.getInvoice = async (req, res, next) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', { underline: true });
        pdfDoc.text('-------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
            if (!prod.product) return;
            totalPrice += prod.quantity * prod.product.price;
            pdfDoc
                .fontSize(14)
                .text(`${prod.product.title} - ${prod.quantity} x $${prod.product.price}`);
        });
        pdfDoc.text('---------------');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
        pdfDoc.end();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
