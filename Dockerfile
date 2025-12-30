# Базовый образ Node.js на основе Debian
FROM node:20-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY web_stack/webstack__node/node-app/package*.json ./
RUN npm install

# Копируем приложение
COPY web_stack/webstack__node/node-app/ .

# Экспонируем порты
EXPOSE 3000-3010 4000-4010

# Запуск
CMD ["npm", "run", "start-all"]
