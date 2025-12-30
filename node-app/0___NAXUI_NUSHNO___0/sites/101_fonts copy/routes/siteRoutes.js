const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController'); // <-- ПРОВЕРЬ ЭТОТ ПУТЬ!

// 📌 Страница выбора шрифтов
router.get('/', mainController.fontPickerPage);

// 📌 API для загрузки CSS со шрифтами
router.get('/css2', mainController.fontsAPI); 

module.exports = router;
