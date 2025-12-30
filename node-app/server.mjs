import {
  express, 
  path, 
  fileURLToPath, 
  db, 
  isProd, 
  sequelize, 
  log, 
  startSites
} from '#import';

const sites = [];
const links = {};
const runningApps = {};

db.on('error', (err) => log('❌ PostgreSQL ошибка:', err));

async function loadSitesAndStart() {
  db.query("SELECT * FROM sites WHERE is_enable = true")
    .then(async ({ rows }) => {
      log("Загруженные сайты из БД:", JSON.stringify(rows));
      rows.forEach(site => {
        site.local_link = `http://localhost:${site.port}`;
        site.url = isProd ? site.url : site.local_link;
        sites.push(site);
        links[site.name] = site.url;
      });

      log("🔗 Links:", JSON.stringify(links));
      try {
        await startSites(sites, links, isProd, log);
        log(`📊 Все сайты обработаны: ${sites.map(s => s.name).join(', ')}`);
      } catch (err) {
        log("❌ Ошибка при запуске сайтов:", err.message || err);
      }
    })
    .catch(err => {
      log("❌ Ошибка при загрузке сайтов:", err.message || err);
      process.exit(1);
    });
}

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

async function monitorUpdates() {
  setInterval(() => {
    db.query("SELECT * FROM sites WHERE is_enable = true")
      .then(async ({ rows }) => {
        const updatedLinks = {};
        const updatedSites = [];

        rows.forEach(site => {
          site.local_link = `http://localhost:${site.port}`;
          site.url = isProd ? site.url : site.local_link;
          updatedSites.push(site);
          updatedLinks[site.name] = site.url;
        });

        const newSiteNames = updatedSites.map(s => s.name);
        const currentSiteNames = sites.map(s => s.name);
        const addedSites = newSiteNames.filter(name => !currentSiteNames.includes(name));

        if (addedSites.length > 0) {
          log("🆕 Обнаружены новые сайты:", addedSites);
          try {
            await startSites(updatedSites.filter(site => addedSites.includes(site.name)), updatedLinks, isProd, log);
            log(`📊 Все сайты обработаны: ${sites.map(s => s.name).join(', ')}`);
          } catch (err) {
            log("❌ Ошибка при запуске новых сайтов:", err.message || err);
          }
        }

        const removedSites = currentSiteNames.filter(name => !newSiteNames.includes(name));
        if (removedSites.length > 0) {
          log("❌ Отключены сайты:", removedSites);
          removedSites.forEach(name => {
            const server = runningApps[name];
            if (server) {
              server.close(() => {
                log(`🛑 Сервер ${name} остановлен`);
                delete runningApps[name];
              });
            }
          });
        }

        sites.length = 0;
        updatedSites.forEach(site => sites.push(site));
        Object.keys(links).forEach(key => delete links[key]);
        Object.assign(links, updatedLinks);
      })
      .catch(err => {
        log("❌ Ошибка при обновлении сайтов из PostgreSQL:", err.message || err);
      });
  }, 10000);
}

async function init() {
  try {
    await loadSitesAndStartWithRetry();
    monitorUpdates();
  } catch (err) {
    log('❌ Ошибка при инициализации:', err.message || err);
    process.exit(1);
  }
  
}

init();

