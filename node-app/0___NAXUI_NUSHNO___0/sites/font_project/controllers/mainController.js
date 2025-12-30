
const fontsData = require('../models/fonts');

exports.getFonts = (req, res) => {
    res.render('home', { fonts: Object.keys(fontsData) });
};

exports.getFontDetails = (req, res) => {
    const fontName = req.params.fontName;
    const font = fontsData[fontName];
    if (!font) return res.status(404).send('Font not found');
    res.render('fontDetails', { fontName, font });
};

exports.getSelection = (req, res) => {
    res.render('selection');
};

exports.getEmbedCode = (req, res) => {
    res.render('embedCode');
};
