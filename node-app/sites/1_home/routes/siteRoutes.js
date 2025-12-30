import * as mainController from '../controllers/mainController.js';

import { express } from '#import';

const router = express.Router();

router.get('/', mainController.homePage);
router.get('/projects', mainController.projectsPage);

router.use((req, res) => mainController.errorPage(req, res));

export default router;
