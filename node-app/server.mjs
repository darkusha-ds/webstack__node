import {
  express,
  db,
  isProd,
  log,
  startSites,
} from '#import';

// --- runtime state
let sites = [];              // актуальные сайты (из БД)
let links = {};              // name -> url
let hostToSite = new Map();  // host -> site
let hostToApp = new Map();   // host -> express app (router)

const PORT = Number(process.env.PORT || 3000);

db.on('error', (err) => log('❌ PostgreSQL ошибка:', err));

function normalizeHost(hostHeader) {
  const raw = (hostHeader || '').toString().trim().toLowerCase();
  // убираем порт, если вдруг прилетел
  return raw.split(':')[0];
}

function hostFromUrl(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

function buildRuntimeFromRows(rows) {
  const nextSites = [];
  const nextLinks = {};
  const nextHostToSite = new Map();

  rows.forEach((site) => {
    // ВАЖНО: теперь сайт НЕ обязан иметь свой порт.
    // Оставляем поле port как историческое, но оно больше не используется для listen.

    const prodUrl = site.url;
    const host = hostFromUrl(prodUrl);

    // если url битый — пропускаем
    if (!host) {
      log(`⚠️ Пропущен сайт ${site.name}: некорректный url=${site.url}`);
      return;
    }

    // сохраняем host прямо в объекте (удобно для startSites)
    site.__host = host;

    // ссылку в locals оставляем как раньше (в dev можно подменять на локальную)
    site.local_link = `http://localhost:${PORT}`;
    site.url = isProd ? prodUrl : site.local_link;

    nextSites.push(site);
    nextLinks[site.name] = site.url;
    nextHostToSite.set(host, site);
  });

  return { nextSites, nextLinks, nextHostToSite };
}

async function reloadSitesFromDb() {
  const { rows } = await db.query('SELECT * FROM sites WHERE is_enable = true');
  const { nextSites, nextLinks, nextHostToSite } = buildRuntimeFromRows(rows);

  sites = nextSites;
  links = nextLinks;
  hostToSite = nextHostToSite;

  log(`📦 Сайты из БД: ${sites.map((s) => s.name).join(', ') || '(пусто)'}`);
}

async function rebuildHostRouters() {
  // Создаём/пересоздаём express apps для каждого host
  // startSites теперь возвращает Map(host -> express app)
  hostToApp = await startSites(sites, links, isProd);
}

async function loadSitesAndStartOnce() {
  await reloadSitesFromDb();
  await rebuildHostRouters();
}

async function loadSitesAndStartWithRetry(retries = 5, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await loadSitesAndStartOnce();
      return;
    } catch (err) {
      log(`⚠️ Попытка ${i} из ${retries} — ошибка: ${err.message || err}`);
      if (i === retries) {
        log('❌ Не удалось загрузить сайты/БД после нескольких попыток.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

function pickFallbackHost() {
  // 1) errors.dark-angel.ru, если есть
  const preferred = [...hostToSite.keys()].find((h) => h.startsWith('errors.'));
  if (preferred) return preferred;

  // 2) любой первый
  return hostToSite.keys().next().value || null;
}

function monitorUpdates() {
  setInterval(async () => {
    try {
      const { rows } = await db.query('SELECT * FROM sites WHERE is_enable = true');
      const { nextSites, nextLinks, nextHostToSite } = buildRuntimeFromRows(rows);

      // сравнение по host
      const currentHosts = new Set(hostToSite.keys());
      const newHosts = new Set(nextHostToSite.keys());

      const added = [...newHosts].filter((h) => !currentHosts.has(h));
      const removed = [...currentHosts].filter((h) => !newHosts.has(h));

      if (added.length || removed.length) {
        log(`🔄 Обновление сайтов. Добавлено: ${added.join(', ') || '-'}, удалено: ${removed.join(', ') || '-'}`);
      }

      // обновляем runtime
      sites = nextSites;
      links = nextLinks;
      hostToSite = nextHostToSite;

      // пересобираем роутеры (проще и надёжнее)
      await rebuildHostRouters();
    } catch (err) {
      log('❌ Ошибка при обновлении сайтов из PostgreSQL:', err.message || err);
    }
  }, 10000);
}

async function init() {
  await loadSitesAndStartWithRetry();

  // --- main dynamic host router
  const app = express();

  app.use((req, res, next) => {
    const host = normalizeHost(req.headers.host);

    // если нет прямого совпадения — отдаём fallback
    const selectedHost = hostToApp.has(host) ? host : pickFallbackHost();

    if (!selectedHost) {
      return res.status(503).send('No sites configured');
    }

    req.__siteHost = selectedHost;
    next();
  });

  // делегируем в app конкретного сайта
  app.use((req, res, next) => {
    const h = req.__siteHost;
    const siteApp = hostToApp.get(h);

    if (!siteApp) {
      return res.status(502).send('Site router not ready');
    }

    return siteApp(req, res, next);
  });

  app.listen(PORT, '0.0.0.0', () => {
    log(`🚀 Dynamic host gateway запущен на :${PORT}`);
    log(`🌐 Hosts: ${[...hostToSite.keys()].join(', ') || '(пусто)'}`);
  });

  monitorUpdates();
}

init().catch((err) => {
  log('❌ Ошибка при инициализации:', err.message || err);
  process.exit(1);
});
