import * as mainController from '../controllers/mainController.js';

import { express } from '#import';

const router = express.Router();

router.get('/', mainController.homePage);
router.get('/about', mainController.aboutPage);

export default router;
