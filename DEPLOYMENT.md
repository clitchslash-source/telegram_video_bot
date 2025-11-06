# Deployment Guide - Telegram Video Generator Bot

## Предварительные требования

- Node.js 18+ и pnpm
- MySQL/TiDB база данных
- Telegram Bot Token (от @BotFather)
- KIE.AI API ключ
- Яндекс.Касса аккаунт
- Notion интеграция
- Домен для webhook

## Этапы развертывания

### 1. Подготовка сервера

```bash
# Установка Node.js (если еще не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка pnpm
npm install -g pnpm

# Клонирование репозитория
git clone <your-repo-url> telegram_video_bot
cd telegram_video_bot

# Установка зависимостей
pnpm install
```

### 2. Настройка переменных окружения

Все переменные окружения должны быть установлены в системе:

```bash
export TELEGRAM_BOT_TOKEN="[YOUR_TOKEN]"
export KIE_AI_API_KEY="[YOUR_KEY]"
export YANDEX_KASSA_SHOP_ID="[YOUR_SHOP_ID]"
export YANDEX_KASSA_SECRET_KEY="[YOUR_SECRET]"
export NOTION_API_KEY="[YOUR_API_KEY]"
export NOTION_DATABASE_ID="[YOUR_DATABASE_ID]"
export DATABASE_URL="mysql://user:password@host:3306/telegram_video_bot"
export PORT="3000"
export NODE_ENV="production"
```

### 3. Инициализация базы данных

```bash
# Создание таблиц
pnpm db:push

# Проверка подключения к Notion
node scripts/setup-notion-db.mjs
```

### 4. Установка Telegram webhook

После развертывания на production сервер:

```bash
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/telegram/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Проверка webhook:

```bash
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

### 5. Настройка Яндекс.Касса webhook

В личном кабинете Яндекс.Касса:

1. Перейти в "Настройки" → "Уведомления"
2. Добавить webhook URL: `https://your-domain.com/api/telegram/payment-webhook`
3. Выбрать события: "payment.succeeded", "payment.failed"
4. Сохранить

### 6. Запуск приложения

#### Вариант 1: PM2 (рекомендуется)

```bash
# Установка PM2
npm install -g pm2

# Запуск приложения
pm2 start "pnpm start" --name "telegram-video-bot"

# Сохранение конфигурации
pm2 save

# Автозагрузка при перезагрузке сервера
pm2 startup
```

#### Вариант 2: Systemd

Создать файл `/etc/systemd/system/telegram-video-bot.service`:

```ini
[Unit]
Description=Telegram Video Generator Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/telegram_video_bot
Environment="NODE_ENV=production"
Environment="TELEGRAM_BOT_TOKEN=[YOUR_TOKEN]"
Environment="KIE_AI_API_KEY=[YOUR_KEY]"
Environment="YANDEX_KASSA_SHOP_ID=[YOUR_SHOP_ID]"
Environment="YANDEX_KASSA_SECRET_KEY=[YOUR_SECRET]"
Environment="NOTION_API_KEY=[YOUR_API_KEY]"
Environment="NOTION_DATABASE_ID=[YOUR_DATABASE_ID]"
Environment="DATABASE_URL=..."
ExecStart=/usr/local/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запуск:

```bash
sudo systemctl daemon-reload
sudo systemctl enable telegram-video-bot
sudo systemctl start telegram-video-bot
sudo systemctl status telegram-video-bot
```

### 7. Настройка Nginx (обратный прокси)

```nginx
upstream telegram_bot {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://telegram_bot;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8. SSL сертификат (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

## Мониторинг

### Логирование

Просмотр логов PM2:

```bash
pm2 logs telegram-video-bot
```

Просмотр логов Systemd:

```bash
sudo journalctl -u telegram-video-bot -f
```

### Метрики

Мониторинг процесса:

```bash
pm2 monit
```

### Здоровье приложения

Проверка webhook:

```bash
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

Проверка базы данных:

```bash
mysql -h {host} -u {user} -p {database} -e "SELECT COUNT(*) FROM telegram_users;"
```

## Резервное копирование

### Резервное копирование базы данных

```bash
# Ежедневное резервное копирование
mysqldump -h {host} -u {user} -p {database} > /backup/telegram_bot_$(date +%Y%m%d).sql

# Автоматизация с cron
0 2 * * * mysqldump -h {host} -u {user} -p {database} > /backup/telegram_bot_$(date +\%Y\%m\%d).sql
```

### Резервное копирование Notion

Notion автоматически сохраняет все данные. Дополнительно экспортируйте регулярно:

```bash
# Экспорт базы данных из Notion
# Используйте встроенную функцию экспорта в Notion
```

## Обновление приложения

```bash
# Остановка приложения
pm2 stop telegram-video-bot

# Обновление кода
git pull origin main

# Установка новых зависимостей
pnpm install

# Миграция базы данных (если необходимо)
pnpm db:push

# Запуск приложения
pm2 start telegram-video-bot
```

## Решение проблем

### Webhook не работает

1. Проверьте, что сервер доступен по HTTPS
2. Убедитесь, что firewall не блокирует порт 443
3. Проверьте логи сервера на ошибки
4. Переустановите webhook: `setWebhook`

### Платежи не обрабатываются

1. Проверьте Secret Key Яндекс.Касса
2. Убедитесь, что webhook URL верный
3. Проверьте логи на ошибки при обработке платежей
4. Проверьте, что база данных доступна

### Видео не генерируется

1. Проверьте KIE.AI API ключ
2. Убедитесь, что у пользователя достаточно токенов
3. Проверьте статус KIE.AI API
4. Проверьте логи на ошибки генерации

### Notion не синхронизируется

1. Проверьте Notion API ключ
2. Убедитесь, что база данных доступна
3. Проверьте, что интеграция добавлена в базу данных
4. Проверьте логи на ошибки синхронизации

## Масштабирование

### Горизонтальное масштабирование

Для обработки большого количества пользователей:

1. Используйте Redis для кэширования
2. Используйте очередь задач (Bull, RabbitMQ) для генерации видео
3. Масштабируйте базу данных (репликация, шардинг)
4. Используйте CDN для хранения видео

### Оптимизация производительности

1. Кэшируйте результаты генерации видео
2. Используйте асинхронную обработку для длительных операций
3. Оптимизируйте запросы к базе данных
4. Используйте индексы в базе данных

## Безопасность

1. Используйте HTTPS для всех соединений
2. Регулярно обновляйте зависимости
3. Используйте strong пароли для базы данных
4. Ограничивайте доступ к API ключам
5. Логируйте все операции
6. Регулярно проверяйте логи на аномалии

## Контрольный список развертывания

- [ ] Сервер подготовлен
- [ ] Переменные окружения установлены
- [ ] База данных инициализирована
- [ ] Telegram webhook установлен
- [ ] Яндекс.Касса webhook настроен
- [ ] Notion интеграция проверена
- [ ] SSL сертификат установлен
- [ ] Приложение запущено
- [ ] Логирование настроено
- [ ] Резервное копирование настроено
- [ ] Мониторинг настроен
- [ ] Документация обновлена
