import { path, db } from '#import';

export const getHome = (req, res) => {
  db.query('SELECT DISTINCT ff.name AS name, LOWER(ff.name) as lname FROM fonts_fonts ff ORDER BY lname')
    .then(({ rows }) => {
      res.render('home', { fontGroups: rows.map(({ name }) => ({ name })) });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Ошибка при получении данных');
    });
};

export const getFontPage = (req, res) => {
  const fontName = req.params.name;
  db.query(
    `SELECT DISTINCT fv.weight, fv.italic, fv.width, fv.file, fv.format, fv.id
     FROM fonts_variants fv 
     JOIN fonts_fonts ff ON ff.id = fv.font_id
     WHERE ff.name = $1
     ORDER BY fv.weight, fv.italic`,
    [fontName]
  )
    .then(({ rows }) => {
      res.render('font', {
        family: fontName,
        fontVariantsList: rows
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Ошибка при получении вариантов шрифта');
    });
};

export const generateEmbed = (req, res) => {
  const selected = req.query.family;
  const display = req.query.display || 'swap';

  if (!selected) {
    return res.status(400).send('No fonts selected');
  }

  const fontFamilies = Array.isArray(selected) ? selected : [selected];
  const placeholders = fontFamilies.map((_, i) => `$${i + 1}`).join(',');

  db.query(
    `SELECT fv.*, ff.name AS font_family FROM fonts_variants fv
     JOIN fonts_fonts ff ON ff.id = fv.font_id
     WHERE ff.name IN (${placeholders})`,
    fontFamilies
  )
    .then(({ rows }) => {
      const css = rows.map(variant => {
        return `
@font-face {
  font-family: '${variant.font_family}';
  font-style: ${variant.italic ? 'italic' : 'normal'};
  font-weight: ${variant.weight};
  src: url('/fonts/${variant.file}') format('${variant.format}');
  font-display: ${display};
}`;
      }).join('\n');

      res.set('Content-Type', 'text/css');
      res.send(css);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Ошибка при получении шрифтов');
    });
};