
const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

router.get('/', mainController.getFonts);
router.get('/font/:fontName', mainController.getFontDetails);
router.get('/selection', mainController.getSelection);
router.get('/selection/embed', mainController.getEmbedCode);

module.exports = router;
