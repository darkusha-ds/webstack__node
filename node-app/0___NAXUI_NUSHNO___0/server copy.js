require('events').defaultMaxListeners = 20;
require('dotenv').config(); // Подключаем dotenv для работы с переменными окружения
const express = require('express');
const path = require('path');
const fs = require('fs');
require('module-alias/register');
const config = require('@root/config');
const isProd = config.isProd;
const sites = [];
const links = {};

const db = config.db;

const log = require('../utils/log');
const { getVersionedPath } = require('../utils/versioning');


const runningApps = {};

// Middleware для кеширования всех файлов в /public
function addFileVersions(siteFolder) {
  return (req, res, next) => {
    res.locals.getVersionedPath = (filePath) => getVersionedPath(siteFolder, filePath);
    next();
  };
}

// Функция для статики с кэшированием
function addStaticFiles(siteFolder) {
  return express.static(path.join(__dirname, `sites/${siteFolder}/public`), {
    etag: true,
    maxAge: '30d',
    immutable: true
  });
}

db.on('error', (err) => {
  log('❌ PostgreSQL ошибка:', err);
});

db.query("SELECT * FROM sites WHERE is_enable = true")
  .then(({ rows }) => {
    log("Загруженные сайты из БД:", JSON.stringify(rows));
    if (rows.length === 0) {
      log("⚠️ Нет активных сайтов в БД. Проверь таблицу 'sites' и значение 'is_enable'.");
    }

    rows.forEach(site => {
      site.local_link = `http://localhost:${site.port}`;
      site.url = isProd ? site.url : site.local_link;
      sites.push(site);
    });

    Object.assign(links, Object.fromEntries(
      sites.map((site) => [site.name, site.url])
    ));

    log("🔗 Links:", JSON.stringify(links));
    startSites(sites, links);
  })
  .catch(err => {
    log("❌ Ошибка при загрузке сайтов из PostgreSQL:", err);
    process.exit(1);
  });

function startSites(sites, links) {
  const fontsBasePath = path.join(__dirname, 'library/node_modules');

  // Middleware для отдачи шрифтов из library
  const fontMiddleware = express.Router();

  fontMiddleware.get('/fonts/:fontPackage/:filePath(*)', (req, res) => {
    const { fontPackage, filePath } = req.params;

    const candidates = [
      path.join(fontsBasePath, '@fontsource-variable', fontPackage, filePath),
      path.join(fontsBasePath, '@fontsource', fontPackage, filePath),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    res.status(404).send('Font file not found');
  });

  // Инициализация каждого сайта
  const newSites = sites.filter(site => !runningApps[site.name]);
  newSites.forEach((site) => {
    const app = express();

    // Настройка шаблонов и статических файлов
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, `sites/${site.folder}/views`));
    app.use(addStaticFiles(site.folder)); // Подключаем статику с кэшированием
    app.use(addFileVersions(site.folder)); // Добавляем версии файлов

    // Передача ссылок в запросы и подключение маршрутов
    app.use((req, res, next) => {
      res.locals.site_link = site.url;
      res.locals.links = links;
      // log("Injected links into res.locals:", links);
      next();
    });

    app.use(fontMiddleware);

    const routes = require(`./sites/${site.folder}/routes/siteRoutes`);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/", routes);

    // Запуск сервера
    const server = app.listen(site.port, () => {
      log(`✅ ${site.name} работает на ${site.local_link}`);
      if (isProd) {
        log(`🌍 Доступен по прод-ссылке: ${site.url}`);
      }
    });
    runningApps[site.name] = server;
  });
}

// Автообновление сайтов каждые 10 секунд
setInterval(() => {
  db.query("SELECT * FROM sites WHERE is_enable = true")
    .then(({ rows }) => {
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
        startSites(updatedSites.filter(site => addedSites.includes(site.name)), updatedLinks);
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
