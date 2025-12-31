import {
  express,
  db,
  isProd,
  log,
  startSites,
} from '#import';

import http from 'http';

// --------------------
// CONFIG
// --------------------
const PROD_PORT = Number(process.env.PORT || 3000);
const POLL_MS = Number(process.env.SITES_POLL_MS || 3000);

// --------------------
// RUNTIME STATE
// --------------------
let sites = [];           // enabled sites from DB
let links = {};           // name -> url (dev: localhost:port)
let keyToApp = new Map(); // prod: host -> app, dev: port -> app

// DEV only: port -> http.Server
const devServers = new Map();

db.on('error', (err) => log('❌ PostgreSQL ошибка:', err));

function normalizeHost(hostHeader) {
  return (hostHeader || '').toString().toLowerCase().split(':')[0];
}

function hostFromUrl(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * ВАЖНО:
 * - PROD: key = host (из site.url)
 * - DEV : key = port (из site.port), url = http://localhost:port
 */
function buildRuntimeFromRows(rows) {
  const nextSites = [];
  const nextLinks = {};

  for (const site of rows) {
    if (!site.folder) {
      log(`⚠️ Пропущен сайт ${site.name}: пустой folder`);
      continue;
    }

    if (!site.port) {
      log(`⚠️ Пропущен сайт ${site.name}: пустой port`);
      continue;
    }

    const portNum = Number(site.port);
    if (!Number.isFinite(portNum)) {
      log(`⚠️ Пропущен сайт ${site.name}: некорректный port=${site.port}`);
      continue;
    }

    if (isProd) {
      const host = hostFromUrl(site.url);
      if (!host) {
        log(`⚠️ Пропущен сайт ${site.name}: некорректный url=${site.url}`);
        continue;
      }
      site.__key = host;
      nextLinks[site.name] = site.url;
    } else {
      site.__key = String(portNum);
      nextLinks[site.name] = `http://localhost:${portNum}`;
    }

    nextSites.push(site);
  }

  return { nextSites, nextLinks };
}

async function fetchEnabledSites() {
  const { rows } = await db.query('SELECT * FROM sites WHERE is_enable = true');
  return rows;
}

async function reloadSitesFromDb() {
  const rows = await fetchEnabledSites();
  const { nextSites, nextLinks } = buildRuntimeFromRows(rows);

  sites = nextSites;
  links = nextLinks;

  log(`📦 Enabled: ${sites.map(s => `${s.name}:${s.port}`).join(', ') || '(empty)'}`);
}

async function rebuildApps() {
  keyToApp = await startSites(sites, links, isProd);
}

/**
 * DEV: синхронизирует реальный набор слушателей (портов) с БД.
 * - если порт появился -> listen
 * - если порт исчез -> close
 */
async function syncDevServers(gatewayApp) {
  const desiredPorts = new Set(
    sites
      .map(s => Number(s.port))
      .filter(p => Number.isFinite(p))
  );

  // stop removed ports
  for (const [port, srv] of devServers.entries()) {
    if (!desiredPorts.has(port)) {
      await new Promise((resolve) => {
        srv.close(() => {
          log(`🔴 DEV stopped :${port}`);
          resolve();
        });
      });
      devServers.delete(port);
    }
  }

  // start new ports
  for (const port of desiredPorts) {
    if (devServers.has(port)) continue;

    const srv = http.createServer(gatewayApp);
    await new Promise((resolve, reject) => {
      srv.once('error', reject);
      srv.listen(port, '0.0.0.0', () => {
        log(`🟢 DEV listening http://localhost:${port}`);
        resolve();
      });
    });

    devServers.set(port, srv);
  }
}

function pickFallbackKey() {
  return sites[0]?.__key || null;
}

function makeGatewayApp() {
  const app = express();

  app.use((req, res, next) => {
    let key;

    if (isProd) {
      key = normalizeHost(req.headers.host);
    } else {
      // В DEV ключ = порт на котором пришёл запрос
      key = String(req.socket.localPort);
    }

    const selectedKey = keyToApp.has(key) ? key : pickFallbackKey();
    if (!selectedKey) return res.status(503).send('No sites configured');

    req.__siteKey = selectedKey;
    next();
  });

  app.use((req, res, next) => {
    const siteApp = keyToApp.get(req.__siteKey);
    if (!siteApp) return res.status(502).send('Site app not ready');
    return siteApp(req, res, next);
  });

  return app;
}

async function startProd(gatewayApp) {
  gatewayApp.listen(PROD_PORT, '0.0.0.0', () => {
    log(`🚀 PROD gateway listening on :${PROD_PORT}`);
  });
}

async function startDev(gatewayApp) {
  // стартуем listeners только по БД
  await syncDevServers(gatewayApp);
}

function runtimeSignature() {
  // чтобы понимать, реально ли что-то изменилось
  // (is_enable уже отфильтрован, значит сравниваем набор ключей + folder + port)
  return sites
    .map(s => `${s.__key}|${s.folder}|${s.port}`)
    .sort()
    .join(',');
}

function startMonitor(gatewayApp) {
  let lastSig = runtimeSignature();

  setInterval(async () => {
    try {
      const rows = await fetchEnabledSites();
      const { nextSites, nextLinks } = buildRuntimeFromRows(rows);

      const nextSig = nextSites
        .map(s => `${s.__key}|${s.folder}|${s.port}`)
        .sort()
        .join(',');

      if (nextSig === lastSig) return;

      // применяем новое состояние
      sites = nextSites;
      links = nextLinks;

      log(`🔄 Sites changed: ${sites.map(s => `${s.name}:${s.port}`).join(', ') || '(empty)'}`);

      // пересобрать роутеры
      await rebuildApps();

      // DEV: поднимать/гасить listeners по портам
      if (!isProd) {
        await syncDevServers(gatewayApp);
      }

      lastSig = nextSig;
    } catch (err) {
      log('❌ Monitor error:', err?.message || err);
    }
  }, POLL_MS);
}

async function init() {
  await reloadSitesFromDb();
  await rebuildApps();

  const gatewayApp = makeGatewayApp();

  if (isProd) {
    await startProd(gatewayApp);
  } else {
    await startDev(gatewayApp);
  }

  startMonitor(gatewayApp);
}

init().catch((err) => {
  log('❌ Init error:', err?.message || err);
  process.exit(1);
});