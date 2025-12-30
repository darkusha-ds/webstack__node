const path = require('path');
const fs = require('fs');
const fontsArray = require('../utils/fonts');

// Преобразуем массив в объект для удобства работы


// 📌 Отдаём страницу с шрифтами
exports.fontPickerPage = (req, res) => {
    res.render('home', { fonts });
};

// 📌 API генерации CSS для выбранных шрифтов
const fonts = require('../utils/fonts');

exports.fontsAPI = (req, res) => {
    console.log("🔍 Запрос в API:", req.query);

    let { family, display = 'swap' } = req.query;

    if (!family) return res.status(400).send("❌ Ошибка: Не указаны шрифты!");

    if (typeof family === 'string') {
        family = [family];
    }

    let css = "";

    family.forEach(f => {
        const [name, weightString] = f.replace('family=', '').split(':wght@');
        const weights = weightString ? weightString.split(';') : ["400"];

        if (!fonts[name]) {
            console.warn(`⚠️ Шрифт "${name}" не найден`);
            return;
        }

        weights.forEach(weight => {
            if (!fonts[name][weight]) {
                console.warn(`⚠️ Начертание ${weight} не найдено для ${name}`);
                return;
            }

            let sources = fonts[name][weight];

            // ✅ Если `sources` — объект (Montserrat Unicode)
            if (typeof sources === "object" && !Array.isArray(sources) && sources !== null) {
                const isUnicodeFont = Object.keys(sources).some(subset => subset !== "normal" && subset !== "italic");
            
                if (isUnicodeFont) {
                    // 🔍 Логируем Unicode-шрифт
                    console.log(`🎯 Unicode шрифт: ${name}, weight: ${weight}, sources:`, sources);
            
                    Object.entries(sources).forEach(([subset, file]) => {
                        css += `
@font-face {
    font-family: '${name}';
    font-style: normal;
    font-weight: ${weight};
    font-display: ${display};
    src: url('/fonts/${file}') format('woff2');
    unicode-range: ${getUnicodeRange(subset)};
}
                        `;
                    });
            
                } else {
                    // ✅ Обычный шрифт
                    console.log(`🎯 Обычный шрифт: ${name}, weight: ${weight}, file: ${sources.normal}`);
            
                    css += `
@font-face {
    font-family: '${name}';
    font-style: normal;
    font-weight: ${weight};
    font-display: ${display};
    src: url('/fonts/${sources.normal}') format('woff2');
}
                    `;
                }
            
            } else if (typeof sources === "string") {  
                console.log(`🎯 Обычный шрифт: ${name}, weight: ${weight}, file: ${sources}`);
            
                css += `
@font-face {
    font-family: '${name}';
    font-style: normal;
    font-weight: ${weight};
    font-display: ${display};
    src: url('/fonts/${sources}') format('woff2');
}
                `;
            
            } else {
                console.warn(`⚠️ Ошибка: неправильный формат sources для ${name}, weight: ${weight}:`, sources);
            }            
        });
    });

    console.log("✅ Отправляем CSS:", css);

    res.setHeader("Content-Type", "text/css");
    res.send(css || "/* ❌ Ошибка: не удалось создать CSS */");
};

// 🔥 **Функция для Unicode-диапазонов**
function getUnicodeRange(subset) {
    const unicodeRanges = {
        "cyrillic-ext": "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
        "cyrillic": "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
        "vietnamese": "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
        "latin-ext": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
        "latin": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
    };

    return unicodeRanges[subset] || "normal"; // По умолчанию normal
}

