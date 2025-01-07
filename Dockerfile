# Базовый образ с Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы проекта
COPY package*.json ./
COPY server.js ./
COPY swagger-ui ./swagger-ui

# Устанавливаем зависимости
RUN npm install

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["node", "server.js"]
