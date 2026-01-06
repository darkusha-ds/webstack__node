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

// --- pg pool ---
// ВАЖНО: Pool переживает обрывы соединения и не становится "not queryable"
const { Pool } = pg;

const db = new Pool({
  connectionString: DATABASE_URL,

  // нормальные дефолты (можно переопределить env-ами)
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 5000),
});

// One-time connectivity check
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL pool ready');
  } catch (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err?.message || err);
    process.exit(1);
  }
})();

// Чтобы неожиданные ошибки idle-клиентов пула не роняли процесс
db.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err?.message || err);
});

// --- Sequelize ---
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

export { db, sequelize, isProd };