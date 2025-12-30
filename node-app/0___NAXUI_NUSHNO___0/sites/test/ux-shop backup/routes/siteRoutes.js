// sites/site3/routes/siteRoutes.js
const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

router.get('/', mainController.homePage);

router.get('/contacts', mainController.contactsPage);
router.get('/products', mainController.productsPage);

// router.use((req, res) => res.redirect('/404'));
router.use((req, res) => mainController.errorPage(req, res));

module.exports = router;
