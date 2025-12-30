import { fs, path, fileURLToPath, dirname } from '#import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Функция для проверки существования изображения
function checkImageExists(imageName) {
    const filePath = path.join(__dirname, '../public/img', imageName); // Путь к изображению
    // console.log(`Checking image: ${filePath}`); // Логируем путь для отладки
    return fs.existsSync(filePath); // Возвращает true, если файл существует
}

// Функция для получения пути к изображению, если оно существует
function getImagePath(imageName) {
    // Если изображение существует, возвращаем путь к нему
    if (checkImageExists(imageName)) {
        return imageName;
    }
    // Если изображение не существует, возвращаем путь к дефолтному изображению
    return 'default.png';
}

export default getImagePath;
