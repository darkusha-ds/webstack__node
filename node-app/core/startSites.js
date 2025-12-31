import {
  express,
  path,
  fs,
  fileURLToPath,
  getVersionedPath,
  log,
  icon,
} from '#import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addStatic(siteFolder) {
  return express.static(path.join(__dirname, '..', `sites/${siteFolder}/public`), {
    etag: true,
    maxAge: '30d',
    immutable: true,
  });
}

function addVersions(siteFolder) {
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

export async function buildSiteApp(site, links, isProd) {
  const app = express();

  app.locals.icon = icon;

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', `sites/${site.folder}/views`));

  app.use(addStatic(site.folder));
  app.use(addVersions(site.folder));

  app.use((req, res, next) => {
    res.locals.site_link = isProd ? site.url : `http://localhost:${site.port}`;
    res.locals.links = links;
    next();
  });

  app.use(createFontsMiddleware());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const routePath = new URL(`../sites/${site.folder}/routes/siteRoutes.js`, import.meta.url);
  const { default: routes } = await import(routePath.href);
  app.use('/', routes);

  log(`✅ Site ready: ${site.name} (folder=${site.folder}, key=${site.__key})`);
  return app;
}

export default async function startSites(sites, links, isProd) {
  const map = new Map();

  for (const site of sites) {
    const app = await buildSiteApp(site, links, isProd);
    map.set(site.__key, app);
  }

  return map;
}