const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const db = new sqlite3.Database('./database.db');

// Функция для проверки существования файла изображения
function checkImageExists(imageName) {
    const filePath = path.join(__dirname, '../public/img', imageName); // Путь к изображению
    console.log(`Checking image: ${filePath}`); // Логируем путь для отладки
    return fs.existsSync(filePath); // Возвращает true, если файл существует
}

// Получаем все категории и товары с названием категории
exports.getCategoriesAndProducts = (req, res) => {
    const query = req.query.query || '';
    const categoryName = req.query.category_name || '';

    // Получаем категории
    db.all("SELECT DISTINCT category_name FROM 'ux-shop.products'", [], (err, categories) => {
        if (err) {
            throw err;
        }

        // Формируем SQL запрос для получения товаров
        let sql = "SELECT * FROM 'ux-shop.products' WHERE 1=1";
        let params = [];

        if (query) {
            sql += " AND name LIKE ?";
            params.push('%' + query + '%');
        }

        if (categoryName) {
            sql += " AND category_name = ?";
            params.push(categoryName);
        }

        // Получаем товары
        db.all(sql, params, (err, products) => {
            if (err) {
                throw err;
            }

            // Добавляем проверку на наличие изображения
            const updatedProducts = products.map(product => {
                if (product.image && checkImageExists(product.image)) {
                    return product; // Если изображение существует, используем его
                } else {
                    return { ...product, image: 'default.png' }; // Если нет, подставляем default.png
                }
            });

            // Отправляем данные в шаблон
            res.render('home', {
                categories: categories,
                products: updatedProducts,
                query: query,
                selectedCategory: categoryName
            });
        });
    });
};

// Поиск товаров
exports.searchProducts = (req, res) => {
    const query = req.query.query || '';
    const categoryName = req.query.category_name || '';

    let sql = "SELECT * FROM 'ux-shop.products' WHERE name LIKE ?";
    let params = ['%' + query + '%'];

    if (categoryName) {
        sql += " AND category_name = ?";
        params.push(categoryName);
    }

    db.all(sql, params, (err, products) => {
        if (err) {
            throw err;
        }

        // Загружаем категории
        db.all("SELECT DISTINCT category_name FROM 'ux-shop.products'", [], (err, categories) => {
            if (err) {
                throw err;
            }

            // Добавляем проверку на наличие изображения
            const updatedProducts = products.map(product => {
                if (product.image && checkImageExists(product.image)) {
                    return product; // Если изображение существует, используем его
                } else {
                    return { ...product, image: 'default.png' }; // Если нет, подставляем default.png
                }
            });

            // Отправляем данные в шаблон
            res.render('home', {
                categories: categories,
                products: updatedProducts,
                query: query,
                selectedCategory: categoryName
            });
        });
    });
};
