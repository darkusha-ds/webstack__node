const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 4001;

// Подключение к БД
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключено к SQLite');
    }
});

// Middleware для раздачи статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница - список шрифтов
app.get('/', (req, res) => {
    db.all("SELECT * FROM fonts", [], (err, rows) => {
        if (err) {
            console.error('Ошибка запроса:', err.message);
            res.status(500).send('Ошибка сервера');
            return;
        }
        res.json(rows);
    });
});

// Получение информации о конкретном шрифте
app.get('/font/:id', (req, res) => {
    const fontId = req.params.id;
    db.get("SELECT * FROM fonts WHERE id = ?", [fontId], (err, row) => {
        if (err) {
            console.error('Ошибка запроса:', err.message);
            res.status(500).send('Ошибка сервера');
            return;
        }
        if (!row) {
            res.status(404).send('Шрифт не найден');
            return;
        }
        res.json(row);
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
});
