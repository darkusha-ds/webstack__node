// sites/search text/controllers/mainController.js

const { searchProducts } = require('./productController'); // Импортируем функцию поиска товаров

exports.homePage = (req, res) => {
  const query = req.query.query || '';  // Получаем параметр запроса из URL

  if (query) {
    searchProducts(query, (products) => {
      if (products.length > 0) {
        res.render('home', { query, products });
      } else {
        res.render('home', { query, products: [] });  // Если товары не найдены
      }
    });
  } else {
    res.render('home', { query, products: [] });  // Если нет поискового запроса
  }
};
