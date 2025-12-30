import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import log from './log.js';

// Получаем __dirname эквивалент
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileVersions = {};

function getFileVersion(filePath) {
  if (fileVersions[filePath]) return fileVersions[filePath];

  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    log(`⚠️ Файл не найден: ${filePath}, используем заглушку.`);
    return "default";
  }

  try {
    const stats = fs.statSync(fullPath);
    fileVersions[filePath] = stats.mtimeMs.toString();
  } catch {
    log(`❌ Ошибка доступа к файлу ${filePath}:`, error);
    fileVersions[filePath] = "default";
  }

  return fileVersions[filePath];
}

function getVersionedPath(siteFolder, filePath) {
  return `/${filePath}?v=${getFileVersion(`sites/${siteFolder}/public/${filePath}`)}`;
}

export { getVersionedPath };