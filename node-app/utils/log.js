import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logStream = fs.createWriteStream(path.join(__dirname, '../server.log'), { flags: 'a' });

function log(...args) {
  const message = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2))).join(' ');
  const now = new Date().toLocaleString('sv-SE', {
    timeZone: 'Asia/Yekaterinburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(' ', ', ');
  logStream.write(`[${now}] ${message}\n`);
}

export default log;