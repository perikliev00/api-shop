const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');


// POST /api/auth/signup
exports.postSignup = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email,
            password: hashedPassword,
            cart: { items: [] }
        });
        await user.save();

        // Send signup email (optional)
        try {
            await transporter.sendMail({
                to: email,
                from: "aleksandarperikliev@gmail.com",
                subject: "Signup succeeded!",
                html: '<h1>You successfully signed up!</h1>'
            });
        } catch (e) { /* silent fail for email */ }

        res.status(201).json({ success: true, message: "User created successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/login
exports.postLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }
        // Create JWT
        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '1h' }
        );
        res.json({
            success: true,
            token,
            userId: user._id.toString(),
            expiresIn: 3600
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/logout (optional for stateless JWT)
exports.postLogout = (req, res, next) => {
    // In JWT APIs, logout is handled client-side (just remove token).
    res.json({ success: true, message: "Logout handled client-side. Remove token on client." });
};

// POST /api/auth/reset (Request password reset)
exports.postReset = async (req, res, next) => {
    crypto.randomBytes(32, async (err, buffer) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Token generation failed." });
        }
        const token = buffer.toString('hex');
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(404).json({ success: false, message: "No account with that email found." });
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            await user.save();

            res.json({ success: true, message: "Reset email sent if user exists." });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });
};

// POST /api/auth/new-password
exports.postNewPassword = async (req, res, next) => {
    const { password, userId, passwordToken } = req.body;
    let resetUser;
    try {
        resetUser = await User.findOne({
            resetToken: passwordToken,
            resetTokenExpiration: { $gt: Date.now() },
            _id: userId
        });
        if (!resetUser) {
            return res.status(400).json({ success: false, message: "Invalid or expired token." });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        await resetUser.save();
        res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
