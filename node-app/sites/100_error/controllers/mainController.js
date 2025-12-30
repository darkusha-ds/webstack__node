export const homePage = (req, res) => {
  const requestedDomain = req.headers['x-requested-host'] || req.hostname || "Unknown Domain";  // Получаем домен, по которому был запрос

  // Рендерим страницу ошибки с динамическим сообщением
  res.status(200).render('home', {
    title: 'ERROR',
    domain: requestedDomain,  // Отображаем домен, по которому был запрос
    message: `Domain "${requestedDomain}" not found!`  // Сообщение об ошибке
  });
};