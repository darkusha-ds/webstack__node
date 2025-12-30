import * as mainController from '../controllers/mainController.js';

import { express } from '#import';

const router = express.Router();

router.get('/', mainController.homePage);

export default router;
