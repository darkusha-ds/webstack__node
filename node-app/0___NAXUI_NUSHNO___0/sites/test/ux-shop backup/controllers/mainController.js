exports.homePage = (req, res) => {
  res.render('layout', { 
    title: 'Зоомагазин "PROХВОСТ"', 
    body: 'templates/home', 
    isMainPage: true, 
    isErrorPage: false
  });
};

exports.contactsPage = (req, res) => {
  res.render('layout', { 
    title: 'О нас | PROХВОСТ', 
    body: 'templates/contacts', 
    isMainPage: false, 
    isErrorPage: false
  });
};

exports.productsPage = (req, res) => {
  res.render('layout', { 
    title: 'Каталог | PROХВОСТ', 
    body: 'templates/products', 
    isMainPage: false, 
    isErrorPage: false
  });
};

exports.errorPage = (req, res) => {
  res.status(404).render('layout', { 
    title: 'Страница не найдена | PROХВОСТ', 
    body: 'templates/404', 
    isMainPage: false, 
    isErrorPage: true
  });
};