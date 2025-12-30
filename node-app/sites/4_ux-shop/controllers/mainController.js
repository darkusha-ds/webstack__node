import { searchProducts } from './productController.js';

// Главная страница
export const homePage = (req, res) => {
  const query = req.query.query || '';  // Получаем параметр запроса из URL

  if (query) {
    searchProducts(req, res);  // Передаем запрос и получаем товары и категории
  } else {
    res.render('layout', { 
      title: 'Зоомагазин "PROХВОСТ"', 
      body: 'templates/home', 
      isMainPage: true, 
      isErrorPage: false,
      query,
      products: [],
      categories: [] // Пустой список категорий
    });
  }
};

// Страница контактов
export const contactsPage = (req, res) => {
  const query = req.query.query || '';

  if (query) {
    searchProducts(req, res);  // Передаем запрос и получаем товары и категории
  } else {
    res.render('layout', { 
      title: 'О нас | PROХВОСТ', 
      body: 'templates/contacts', 
      isMainPage: false, 
      isErrorPage: false,
      query,
      products: [],
      categories: [] // Пустой список категорий
    });
  }
};

// Страница каталога
export const catalogPage = (req, res) => {
  const query = req.query.query || '';

  if (query) {
    searchProducts(req, res);  // Передаем запрос и получаем товары и категории
  } else {
    res.render('layout', { 
      title: 'Каталог | PROХВОСТ', 
      body: 'templates/catalog', 
      isMainPage: false, 
      isErrorPage: false,
      query,
      products: [],
      categories: [] // Пустой список категорий
    });
  }
};

// Страница товара
export const productPage = (req, res) => {
  const query = req.query.query || '';

  if (query) {
    searchProducts(req, res);  // Передаем запрос и получаем товары и категории
  } else {
    res.render('layout', { 
      title: 'Товары | PROХВОСТ', 
      body: 'templates/product', 
      isMainPage: false, 
      isErrorPage: false,
      query,
      products: [],
      categories: [] // Пустой список категорий
    });
  }
};

// Страница ошибки
export const errorPage = (req, res) => {
  res.status(404).render('layout', { 
    title: 'Страница не найдена | PROХВОСТ', 
    body: 'templates/404', 
    isMainPage: false, 
    isErrorPage: true
  });
};
