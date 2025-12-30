import adminOptions from './admin.config.js';
import { ComponentLoader } from 'adminjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminLocale, log } from '#import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentLoader = new ComponentLoader();
const COMPONENTS = {
  FontTools: componentLoader.add('FontTools', path.join(__dirname, '../../components/FontTools.jsx')),
}
log('🧩 Зарегистрированные компоненты:', COMPONENTS);

import { AdminJS, AdminJSExpress, AdminJSSequelize, express } from '#import';

AdminJS.registerAdapter(AdminJSSequelize);
log('🛠 Запуск AdminJS...');
log('📂 Текущий путь запуска:', process.cwd());
log('📁 Ожидается adminjs.config.cjs в этом каталоге:', path.join(process.cwd(), 'adminjs.config.cjs'));
const admin = new AdminJS({
  ...adminOptions,
  componentLoader,
  locale: adminLocale,
  pages: {
    Fonts: {
      label: '🧩 Шрифты',
      icon: 'Settings',
      component: COMPONENTS.FontTools,
    },
  },
});

async function loadSitesAndStartWithRetry(retries = 5, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await loadSitesAndStart();
      return;
    } catch (err) {
      log(`⚠️ Попытка ${i} из ${retries} — ошибка подключения: ${err.message || err}`);
      if (i === retries) {
        log("❌ Не удалось подключиться к базе после нескольких попыток.");
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      if (email === 'admin' && password === '1234') return { email };
      return null;
    },
    cookieName: 'adminjs',
    cookiePassword: 'super-secret-password',
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    secret: 'session-secret',
  }
);

const adminApp = express();
adminApp.use(admin.options.rootPath, adminRouter);

export default adminApp;