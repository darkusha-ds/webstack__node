import * as mainController from '../controllers/mainController.js';

import { express } from '#import';

const router = express.Router();

router.get('/', mainController.getHome);
router.get('/font/:name', mainController.getFontPage);
router.get('/css2', mainController.generateEmbed);

export default router;