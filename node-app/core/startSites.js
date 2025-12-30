import { express, path, fs, fileURLToPath,getVersionedPath, log, icon  } from '#import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runningApps = {};

function addStaticFiles(siteFolder) {
  return express.static(path.join(__dirname, '..', `sites/${siteFolder}/public`), {
    etag: true,
    maxAge: '30d',
    immutable: true
  });
}

function addFileVersions(siteFolder) {
  return (req, res, next) => {
    res.locals.getVersionedPath = (filePath) => getVersionedPath(siteFolder, filePath);
    next();
  };
}

async function startSites(sites, links, isProd) {
  const fontsBasePath = path.join(__dirname, '..', 'library/node_modules');

  log(`🚀 Инициализация всех сайтов (${sites.length})...`);

  const fontMiddleware = express.Router();
  fontMiddleware.get('/fonts/:fontPackage/:filePath(*)', (req, res) => {
    const { fontPackage, filePath } = req.params;
    const candidates = [
      path.join(fontsBasePath, '@fontsource-variable', fontPackage, filePath),
      path.join(fontsBasePath, '@fontsource', fontPackage, filePath),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) return res.sendFile(filePath);
    }

    res.status(404).send('Font file not found');
  });

  try {
    await Promise.allSettled(sites.map(async (site) => {
      if (runningApps[site.name]) {
        log(`ℹ️ Сайт ${site.name} уже запущен`);
        return;
      }

      try {
        log(`🔄 Запуск сайта ${site.name} (${site.folder})`);

        const app = express();

        app.locals.icon = icon; // <-- хелпер доступен в EJS как <%- icon('telegram', { size: 20 }) %>

        app.set("view engine", "ejs");
        app.set("views", path.join(__dirname, '..', `sites/${site.folder}/views`));
        app.use(addStaticFiles(site.folder));
        app.use(addFileVersions(site.folder));
        app.use((req, res, next) => {
          res.locals.site_link = site.url;
          res.locals.links = links;
          next();
        });

        app.use(fontMiddleware);

        try {
          const routePath = new URL(`../sites/${site.folder}/routes/siteRoutes.js`, import.meta.url);
          const { default: routes } = await import(routePath.href);
          app.use(express.json());
          app.use(express.urlencoded({ extended: true }));
          app.use("/", routes);

          const server = app.listen(site.port, '0.0.0.0')
            .on('listening', () => {
              log(`✅ ${site.name} работает на ${site.local_link}`);
              if (isProd) log(`🌍 Доступен по прод-ссылке: ${site.url}`);
            })
            .on('error', (err) => {
              log(`❌ Ошибка запуска сервера для ${site.name}:`, err);
            });

          runningApps[site.name] = server;
        } catch (err) {
          log(`❌ Ошибка при подключении маршрутов для сайта ${site.name}:`, err.message || err.toString());
        }
      } catch (err) {
        log(`❌ Ошибка при инициализации сайта ${site.name}:`, err);
      }
    }));
  } catch (err) {
    log('❌ Общая ошибка при запуске сайтов:', err);
  }
}

export default startSites;