import * as mainController from '../controllers/mainController.js';
import * as productController from '../controllers/productController.js';

import { express } from '#import';

const router = express.Router();

router.get('/', mainController.homePage);

router.get('/contacts', mainController.contactsPage);
router.get('/catalog', mainController.catalogPage);
router.get('/product', productController.getCategoriesAndProducts);
router.get('/search', productController.getCategoriesAndProducts);

// router.use((req, res) => res.redirect('/404'));
router.use((req, res) => mainController.errorPage(req, res));

export default router;
 