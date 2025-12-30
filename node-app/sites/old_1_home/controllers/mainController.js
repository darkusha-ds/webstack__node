export const homePage = (req, res) => {
  res.render('index');
  // res.render('index', { title: 'Home Page' });
};

export const projectsPage = (req, res) => {
  res.render('my_projects');
  // res.render('my_projects', { title: 'About Us' });
};

export const errorPage = (req, res) => {
  res.status(404).render('404', { 
    title: 'Страница не найден', 
  });
};