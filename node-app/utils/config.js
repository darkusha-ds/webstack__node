// config.js
import pg from 'pg';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  dotenv.config(); // .env загружаем только в dev
}

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('❌ DATABASE_URL не задан в переменных окружения');
}

// --- pg client ---
const { Client } = pg;

const db = new Client({ connectionString: DATABASE_URL });

db.connect().then(() => {
  console.log('✅ PostgreSQL подключен');
}).catch(err => {
  console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
  process.exit(1);
});

// --- Sequelize ---
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

export { db, sequelize, isProd };