const { db2 } = require('./models');
const db = db2.sequelize;
const { QueryTypes: safeQueryTypes } = require('sequelize');
const safeQuery = db.query.bind(db);

let isReconnecting = false;

const safeQueryWithRetry = async (sql, options, retries = 3) => {
  try {
    return await safeQuery(sql, options);
  } catch (error) {
    if (retries > 0 && error.code === 'ECONNRESET') {
      await reconnectSequelize();
      console.warn('🔁 Повтор запроса после ECONNRESET...');
      await new Promise(res => setTimeout(res, 1000));
      return safeQueryWithRetry(sql, options, retries - 1);
    }
    throw error;
  }
};

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled Promise Rejection:', error);
});
process.on('uncaughtException', error => {
  handleUncaughtException(error);
});

async function handleUncaughtException(error) {
  const isConnectionLost =
    error.code === 'ECONNRESET' ||
    error.message?.includes('Connection terminated unexpectedly');

  if (isConnectionLost) {
    if (isReconnecting) {
      console.warn('⏳ Уже выполняется переподключение...');
      return;
    }

    isReconnecting = true;
    console.warn('🔁 Обнаружена потеря соединения в uncaughtException, пытаемся переподключиться...');
    await reconnectSequelize();
    isReconnecting = false;
    return;
  }

  console.error('❌ Uncaught Exception:', error);
}

async function reconnectSequelize() {
  try {
    await db.authenticate();
    console.log('🔁 Sequelize переподключен');
  } catch (err) {
    console.error('❌ Не удалось переподключиться:', err);
  }
}

async function initDatabase() {
  try {
    // Таблица шрифтов
    await safeQueryWithRetry(`
      CREATE TABLE IF NOT EXISTS fonts_fonts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL
      )
    `);

    // Таблица вариантов (файлов) шрифтов
    await safeQueryWithRetry(`
      CREATE TABLE IF NOT EXISTS fonts_variants (
        id SERIAL PRIMARY KEY,
        font_id INTEGER NOT NULL,
        weight INTEGER DEFAULT 400,
        italic BOOLEAN DEFAULT FALSE,
        variable BOOLEAN DEFAULT FALSE,
        width INTEGER DEFAULT 100,
        file TEXT NOT NULL,
        format TEXT NOT NULL,
        FOREIGN KEY (font_id) REFERENCES fonts_fonts(id) ON DELETE CASCADE
      )
    `);

    // Таблица языков/наборов символов
    await safeQueryWithRetry(`
      CREATE TABLE IF NOT EXISTS fonts_subsets (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      )
    `);

    // Таблица связи "многие-ко-многим" между вариантом и поднабором
    await safeQueryWithRetry(`
      CREATE TABLE IF NOT EXISTS fonts_variant_subsets (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER NOT NULL,
        subset_id INTEGER NOT NULL,
        FOREIGN KEY (variant_id) REFERENCES fonts_variants(id) ON DELETE CASCADE,
        FOREIGN KEY (subset_id) REFERENCES fonts_subsets(id) ON DELETE CASCADE
      )
    `);

    const fs = require('fs');
    const path = require('path');

    const fontDirs = [
      { path: 'library/node_modules/@fontsource', isVariable: false },
      { path: 'library/node_modules/@fontsource-variable', isVariable: true }
    ];

    const SUBSET_NAMES = [
      'latin', 'latin-ext', 'cyrillic', 'cyrillic-ext',
      'greek', 'greek-ext', 'vietnamese', 'hebrew', 'devanagari', 'arabic'
    ];

    for (const { path: basePath, isVariable } of fontDirs) {
      if (!fs.existsSync(basePath)) return;
      const fonts = fs.readdirSync(basePath);
      console.log(`🔍 Папка: ${basePath}`);
      console.log(`📁 Найдено пакетов:`, fonts);

      for (const slug of fonts) {
        const fontFolder = path.join(basePath, slug);
        const filesFolder = path.join(fontFolder, 'files');
        if (!fs.existsSync(filesFolder)) {
          console.log(`⛔️ Не найден files/ у ${slug}`);
          return;
        }

        try {
          const fontRow = await safeQueryWithRetry(`SELECT id FROM fonts_fonts WHERE slug = ?`, {
            replacements: [slug],
            type: safeQueryTypes.SELECT
          });
          
          if (fontRow.length > 0) {
            console.log(`ℹ️ Шрифт уже в БД: ${slug}`);
            await processFontFiles(fontRow[0].id);
          } else {
            const name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            await safeQueryWithRetry(`
              INSERT INTO fonts_fonts (name, slug)
              VALUES (?, ?)
              ON CONFLICT (slug) DO NOTHING
            `, {
              replacements: [name, slug],
              type: safeQueryTypes.INSERT
            });

            console.log(`🆕 Шрифт добавлен: ${slug}`);

            const newFontRow = await safeQueryWithRetry(`SELECT id FROM fonts_fonts WHERE slug = ?`, {
              replacements: [slug],
              type: safeQueryTypes.SELECT
            });

            await processFontFiles(newFontRow[0].id);
          }
        } catch (err) {
          console.error(`⚠️ Пропускаю ${slug}:`, err.message);
        }

        async function processFontFiles(fontId) { // temporarily commented out
          const files = fs.readdirSync(filesFolder);
          console.log(`📂 Файлы в ${filesFolder}:`, files);
          if (!files || files.length === 0) {
            console.log(`⚠️ В папке files/ у ${slug} нет файлов`);
          }

          const existingFiles = new Set();
          const rows = await safeQueryWithRetry(`SELECT file FROM fonts_variants WHERE font_id = ? AND variable = ?`, {
            replacements: [fontId, isVariable],
            type: safeQueryTypes.SELECT
          });
          rows.forEach(row => existingFiles.add(row.file));

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (i % 100 === 0 && i > 0) {
              await new Promise(r => setTimeout(r, 100));
            }

            if (existingFiles.has(file)) {
              console.log(`⏭ Пропускаю уже существующий файл: ${file}`);
              continue;
            }
            console.log(`📦 Обрабатываю файл: ${file} из ${slug}`);
            const ext = path.extname(file).toLowerCase().replace('.', '');
            if (!['woff', 'woff2', 'ttf'].includes(ext)) continue;

            const weightMatch = file.match(/(\d{3})/);
            const weight = weightMatch ? parseInt(weightMatch[1]) : 400;
            const italic = /italic/i.test(file);
            const width = 100;

            await safeQueryWithRetry(`
              INSERT INTO fonts_variants (font_id, weight, italic, variable, width, file, format)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, {
              replacements: [fontId, weight, italic, isVariable, width, file, ext],
              type: safeQueryTypes.INSERT
            });

            const variantRow = await safeQueryWithRetry(`
              SELECT id FROM fonts_variants
              WHERE font_id = ? AND weight = ? AND italic = ? AND variable = ? AND file = ?
            `, {
              replacements: [fontId, weight, italic, isVariable, file],
              type: safeQueryTypes.SELECT
            });

            if (variantRow.length > 0) {
              const variantId = variantRow?.[0]?.id;
              console.log(`✅ Добавлен вариант: ${file} (id: ${variantId})`);
              await new Promise(r => setTimeout(r, 10)); // небольшая пауза между запросами

              for (const subset of SUBSET_NAMES) {
                if (file.includes(subset)) {
                  await safeQueryWithRetry(`INSERT INTO fonts_subsets (name) VALUES (?) ON CONFLICT DO NOTHING`, {
                    replacements: [subset],
                    type: safeQueryTypes.INSERT
                  });
                  const subsetRow = await safeQueryWithRetry(`SELECT id FROM fonts_subsets WHERE name = ?`, {
                    replacements: [subset],
                    type: safeQueryTypes.SELECT
                  });
                  if (subsetRow.length > 0) {
                    await safeQueryWithRetry(`
                      INSERT INTO fonts_variant_subsets (variant_id, subset_id)
                      VALUES (?, ?)
                    `, {
                      replacements: [variantId, subsetRow[0].id],
                      type: safeQueryTypes.INSERT
                    });
                  }
                }
              }
            }
          } // temporarily commented out
        } 
      }
    }

    // Таблица ссылок на сайты
    await safeQueryWithRetry(`
      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        folder TEXT NOT NULL,
        port INTEGER NOT NULL,
        url TEXT NOT NULL,
        is_enable BOOLEAN DEFAULT TRUE
      )
    `);

  } catch (err) {
    console.error('❌ Ошибка при инициализации БД:', err);
    process.exit(1);
  }
}

(async () => {
  try {
    await initDatabase();
    console.log('✅ Структура БД успешно создана.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка при инициализации БД:', err);
    process.exit(1);
  }
  // no finally block
})();