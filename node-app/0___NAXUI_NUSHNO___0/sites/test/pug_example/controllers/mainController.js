exports.homePage = (req, res) => {
  res.render('home', { title: 'Site 4 - Home', site_num: 'Site 4' });
};

exports.aboutPage = (req, res) => {
  res.render('about', { title: 'Site 4 - About Us', site_num: 'Site 4' });
};
