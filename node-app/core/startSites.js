import { express, path, fs, fileURLToPath, getVersionedPath, log, icon } from '#import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addStaticFiles(siteFolder) {
  return express.static(path.join(__dirname, '..', `sites/${siteFolder}/public`), {
    etag: true,
    maxAge: '30d',
    immutable: true,
  });
}

function addFileVersions(siteFolder) {
  return (req, res, next) => {
    res.locals.getVersionedPath = (filePath) => getVersionedPath(siteFolder, filePath);
    next();
  };
}

function createFontsMiddleware() {
  const fontsBasePath = path.join(__dirname, '..', 'library/node_modules');
  const router = express.Router();

  router.get('/fonts/:fontPackage/:filePath(*)', (req, res) => {
    const { fontPackage, filePath } = req.params;
    const candidates = [
      path.join(fontsBasePath, '@fontsource-variable', fontPackage, filePath),
      path.join(fontsBasePath, '@fontsource', fontPackage, filePath),
    ];

    for (const candidatePath of candidates) {
      if (fs.existsSync(candidatePath)) return res.sendFile(candidatePath);
    }

    res.status(404).send('Font file not found');
  });

  return router;
}

/**
 * Создаёт router (Express app) для конкретного сайта.
 * ВАЖНО: НЕ слушает порт. Это нужно для динамической маршрутизации по Host.
 */
export async function buildSiteApp(site, links, isProd) {
  const app = express();

  app.locals.icon = icon; // EJS helper: <%- icon('telegram', { size: 20 }) %>

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', `sites/${site.folder}/views`));

  app.use(addStaticFiles(site.folder));
  app.use(addFileVersions(site.folder));

  // locals
  app.use((req, res, next) => {
    res.locals.site_link = site.url;
    res.locals.links = links;
    next();
  });

  // fonts (shared handler)
  app.use(createFontsMiddleware());

  // body parsers (нужны для form/json во всех сайтах)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // routes
  const routePath = new URL(`../sites/${site.folder}/routes/siteRoutes.js`, import.meta.url);
  const { default: routes } = await import(routePath.href);
  app.use('/', routes);

  log(`✅ Router сайта ${site.name} (${site.folder}) готов`);
  if (isProd) log(`🌍 Прод-ссылка: ${site.url}`);

  return app;
}

/**
 * Backward-compatible default export (чтобы не ломать импорты).
 * Теперь возвращает Map(host -> express app) и НЕ запускает прослушивание портов.
 */
async function startSites(sites, links, isProd) {
  const map = new Map();

  await Promise.all(
    sites.map(async (site) => {
      const app = await buildSiteApp(site, links, isProd);
      map.set(site.__host, app);
    })
  );

  return map;
}

export default startSites;