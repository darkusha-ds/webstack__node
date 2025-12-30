const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Главная страница с категориями и товарами
router.get('/', productController.getCategoriesAndProducts);
router.get('/search', productController.getCategoriesAndProducts);

module.exports = router;
