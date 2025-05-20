const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth');
const User = require('../models/user');

// POST /api/auth/signup
router.post('/signup',
    [
        body('email')
            .isEmail().withMessage('Please enter a valid email.')
            .normalizeEmail()
            .custom(async (value) => {
                const userDoc = await User.findOne({ email: value });
                if (userDoc) {
                    return Promise.reject('E-Mail already exists, please pick a different one.');
                }
            }),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters'
        )
            .isLength({ min: 5 })
            .isAlphanumeric(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match.');
                }
                return true;
            })
    ],
    authController.postSignup
);

// POST /api/auth/login
router.post('/login',
    [
        body('email', 'Email is invalid')
            .isEmail()
            .normalizeEmail(),
        body('password', 'Password must not be empty')
            .notEmpty()
    ],
    authController.postLogin
);

// POST /api/auth/logout
router.post('/logout', authController.postLogout);

// (Optional) Password reset endpoints as API
router.post('/reset', authController.postReset);
router.post('/new-password', authController.postNewPassword);

module.exports = router;
