export const homePage = (req, res) => {
  res.render('home', { 
    title: 'Site 0 - Home', 
    links: res.locals.links || {} 
  });
};
