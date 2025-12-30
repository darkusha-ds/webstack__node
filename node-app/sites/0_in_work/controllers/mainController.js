export const homePage = (req, res) => {
  res.render('home', { title: 'Site 3 - Home', site_num: 'Site 3' });
};

export const aboutPage = (req, res) => {
  res.render('about', { title: 'Site 3 - About Us', site_num: 'Site 3' });
};
