const express=require("express");

const { check,body } = require('express-validator');

const rootDir=require('../utill/path');

const path=require('path');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router=express.Router();

const bodyParser=require('body-parser')

router.use(bodyParser.urlencoded({extended:false}));

// /admin/add-product => GET

router.get('/add-product',isAuth,adminController.getAddProduct);

// /admin/products => GET
router.get('/products',isAuth,adminController.getProducts);

//   /admin/add-product => POST

router.post('/add-product',
    [
        body('title')
        .isLength({min:3})
        .isAlphanumeric()
        .trim(),
        body('image'),
        body('price')
        .isLength({min:2})
        .isFloat(),
        body('description')
        .isLength({min:5,max:400})
        .trim()
        ],
    isAuth,adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);

router.post('/edit-product',
    [
        body('title')
        .isLength({min:3})
        .isString()
        .trim(),
        body('price')
        .isFloat(),
        body('description')
        .isLength({min:5,max:400})
        .trim()
        ],
    isAuth,adminController.postEditProduct);

router.delete('/product/:productId',isAuth,adminController.deleteProduct)

module.exports = router