import { express } from '#import'
import * as mainController from '../controllers/mainController.js';

const router = express.Router();

router.get('/', mainController.homePage);
router.get('/about', mainController.aboutPage);

export default router;
