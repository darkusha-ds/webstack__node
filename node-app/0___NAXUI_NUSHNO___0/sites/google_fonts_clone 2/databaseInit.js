const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Подключение к базе данных
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключено к SQLite');
    }
});

// Создание таблицы fonts
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS fonts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            folder TEXT NOT NULL,
            file TEXT NOT NULL,
            is_variable BOOLEAN DEFAULT 0,
            weight_min INTEGER DEFAULT 100,
            weight_max INTEGER DEFAULT 900,
            width_min INTEGER DEFAULT 75,
            width_max INTEGER DEFAULT 100,
            italic BOOLEAN DEFAULT 0
        )
    `, () => {
        console.log('Таблица fonts создана');
        loadFonts(); // Запуск загрузки шрифтов
    });
});

// Путь к папке со шрифтами
const fontsDir = path.join(__dirname, 'public', 'fonts');

// Функция загрузки шрифтов в БД
function loadFonts() {
    fs.readdir(fontsDir, (err, folders) => {
        if (err) {
            console.error('Ошибка чтения папки fonts:', err);
            return;
        }

        folders.forEach((folder) => {
            const folderPath = path.join(fontsDir, folder);
            
            if (!fs.statSync(folderPath).isDirectory()) return;

            fs.readdir(folderPath, (err, files) => {
                if (err) {
                    console.error(`Ошибка чтения папки ${folder}:`, err);
                    return;
                }

                files.forEach((file) => {
                    const ext = path.extname(file);
                    const isVariable = file.includes('VariableFont');
                    const italic = file.toLowerCase().includes('italic');

                    if (!['.ttf', '.otf', '.woff2', '.woff'].includes(ext)) return;

                    const fontName = path.basename(file, ext);
                    
                    let weightMin = 100, weightMax = 900;
                    if (!isVariable) {
                        const weightMatch = file.match(/(\d{3})/);
                        if (weightMatch) {
                            weightMin = weightMax = parseInt(weightMatch[0], 10);
                        }
                    }

                    db.run(
                        `INSERT OR IGNORE INTO fonts (name, folder, file, is_variable, weight_min, weight_max, italic)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [fontName, folder, file, isVariable ? 1 : 0, weightMin, weightMax, italic ? 1 : 0],
                        (err) => {
                            if (err) console.error('Ошибка добавления шрифта:', err.message);
                            else console.log(`Добавлен шрифт: ${fontName}`);
                        }
                    );
                });
            });
        });
    });
}

// Закрываем БД после загрузки
setTimeout(() => {
    db.close(() => {
        console.log('БД закрыта');
    });
}, 5000);
