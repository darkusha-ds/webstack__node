import getImagePath from './imageHelper.js';

import { path, db, fileURLToPath } from '#import';


// Получаем все категории с изображениями и товары
export const getCategoriesAndProducts = async (req, res) => {
    const query = req.query.query || '';
    const categoryName = req.query.category_name || '';

    try {
        // Получаем категории с изображениями
        const categoriesResult = await db.query('SELECT category_name, category_image FROM ux_shop_categories');
        const categories = categoriesResult.rows;

        // Формируем SQL-запрос для получения товаров
        let sql = 'SELECT * FROM ux_shop_products WHERE 1=1';
        const params = [];
        if (query) {
            sql += ' AND name ILIKE $' + (params.length + 1);
            params.push(`%${query}%`);
        }
        if (categoryName) {
            sql += ' AND category_name = $' + (params.length + 1);
            params.push(categoryName);
        }

        const productsResult = await db.query(sql, params);
        const products = productsResult.rows;

        const updatedProducts = products.map(product => {
            product.image = getImagePath(product.image);
            return product;
        });

        const updatedCategories = categories.map(category => {
            category.category_image = getImagePath(category.category_image);
            return category;
        });

        res.render('layout', {
            title: 'Товары | PROХВОСТ',
            body: 'templates/product',
            isMainPage: false,
            isErrorPage: false,
            categories: updatedCategories,
            products: updatedProducts,
            query: query,
            selectedCategory: categoryName
        });
    } catch (err) {
        console.error('Ошибка при работе с базой данных:', err);
        res.status(500).send('Ошибка сервера');
    }
};

// Поиск товаров
export const searchProducts = async (req, res) => {
    const query = req.query.query || '';
    const categoryName = req.query.category_name || '';

    try {
        let sql = 'SELECT * FROM ux_shop_products WHERE name ILIKE $1';
        const params = [`%${query}%`];

        if (categoryName) {
            sql += ' AND category_name = $2';
            params.push(categoryName);
        }

        const productsResult = await db.query(sql, params);
        const products = productsResult.rows;

        const categoriesResult = await db.query('SELECT category_name, category_image FROM ux_shop_categories');
        const categories = categoriesResult.rows;

        const updatedProducts = products.map(product => {
            product.image = getImagePath(product.image);
            return product;
        });

        const updatedCategories = categories.map(category => {
            category.category_image = getImagePath(category.category_image);
            return category;
        });

        res.render('layout', {
            title: 'Товары | PROХВОСТ',
            body: 'templates/product',
            isMainPage: false,
            isErrorPage: false,
            categories: updatedCategories,
            products: updatedProducts,
            query: query,
            selectedCategory: categoryName
        });
    } catch (err) {
        console.error('Ошибка при поиске товаров:', err);
        res.status(500).send('Ошибка сервера');
    }
};
