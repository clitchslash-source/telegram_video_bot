# Quick Start Guide - Telegram Video Generator Bot

## Быстрый старт за 5 минут

### 1. Клонирование и установка

```bash
# Если у вас еще нет проекта
git clone <your-repo-url> telegram_video_bot
cd telegram_video_bot

# Установка зависимостей
pnpm install
```

### 2. Настройка переменных окружения

Все переменные уже установлены в системе. Проверьте:

```bash
echo $TELEGRAM_BOT_TOKEN
echo $KIE_AI_API_KEY
echo $YANDEX_KASSA_SHOP_ID
echo $NOTION_API_KEY
echo $DATABASE_URL
```

### 3. Инициализация базы данных

```bash
# Создание таблиц
pnpm db:push
```

### 4. Запуск приложения

```bash
# Разработка (с горячей перезагрузкой)
pnpm dev

# Production
pnpm build
pnpm start
```

Сервер запустится на `http://localhost:3000`

### 5. Тестирование webhook локально

```bash
# Установка ngrok (если еще не установлен)
brew install ngrok  # macOS
# или скачайте с https://ngrok.com/download

# Запуск ngrok
ngrok http 3000

# Вы получите URL вроде: https://abc123.ngrok.io
```

### 6. Установка webhook для тестирования

```bash
TOKEN="8531118020:AAEQBjafvKseqz0rBVXlMQFv9vEZdVvRC88"
WEBHOOK_URL="https://abc123.ngrok.io/api/telegram/webhook"

curl -X POST https://api.telegram.org/bot${TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}"
```

### 7. Тестирование бота

Откройте Telegram и найдите вашего бота, отправьте:

```
/start
/balance
/buy
/help
```

Проверьте логи в консоли:

```
[07:30:18] Server running on http://localhost:3000/
[Bot] Start command received from user 123456
[Bot] User created with 60 free tokens
```

## Структура проекта

```
telegram_video_bot/
├── client/                 # React frontend (не используется для бота)
├── server/
│   ├── _core/             # Основные конфигурации
│   ├── db.ts              # Функции работы с БД
│   ├── routers.ts         # tRPC роутеры
│   ├── routes/
│   │   └── telegramWebhook.ts  # Webhook endpoints
│   └── services/
│       ├── telegramBotClient.ts    # Telegram API клиент
│       ├── kieAiClient.ts          # KIE.AI API клиент
│       ├── yandexKassaClient.ts    # Yandex.Kassa API клиент
│       ├── notionClient.ts         # Notion API клиент
│       └── botHandlers.ts          # Обработчики команд
├── drizzle/               # Миграции БД
├── shared/                # Общие константы и конфиги
└── scripts/               # Утилиты и скрипты
```

## Основные команды

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Запуск в режиме разработки |
| `pnpm build` | Сборка для production |
| `pnpm start` | Запуск production версии |
| `pnpm db:push` | Инициализация/обновление БД |
| `pnpm test` | Запуск тестов |

## Структура данных

### Пользователь

```javascript
{
  telegramId: "123456789",
  username: "johndoe",
  firstName: "John",
  lastName: "Doe",
  tokenBalance: 60,           // Текущий баланс
  totalTokensPurchased: 0,    // Всего куплено
  totalTokensSpent: 0,        // Всего потрачено
  totalGenerations: 0,        // Всего видео
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Генерация видео

```javascript
{
  telegramId: "123456789",
  inputType: "text",          // text, image, voice
  duration: "10",             // 10 или 15 сек
  quality: "standard",        // low, standard, high
  prompt: "Красивый закат",
  tokensCost: 20,
  status: "completed",        // pending, processing, completed, failed
  outputVideoUrl: "https://...",
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Платеж

```javascript
{
  telegramId: "123456789",
  paymentId: "payment_12345",
  amount: "500.00",
  tokens: 500,
  status: "succeeded",        // pending, succeeded, failed, cancelled
  createdAt: "2024-01-01T00:00:00Z"
}
```

## Логирование

Все операции логируются в консоль:

```
[Telegram Webhook] Message received from user 123456
[Bot] Start command received
[Database] User created: 123456
[Notion] User synced to Notion
[Bot] Welcome message sent
```

## Отладка

### Включить подробное логирование

```bash
DEBUG=* pnpm dev
```

### Проверить подключение к БД

```bash
mysql -h {host} -u {user} -p {database} -e "SELECT COUNT(*) FROM telegram_users;"
```

### Проверить webhook статус

```bash
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

### Посмотреть логи приложения

```bash
# Если используете PM2
pm2 logs telegram-video-bot

# Если используете Systemd
sudo journalctl -u telegram-video-bot -f
```

## Часто задаваемые вопросы

**Q: Как добавить новую команду?**
A: Добавьте обработчик в `server/services/botHandlers.ts` и зарегистрируйте в `server/routes/telegramWebhook.ts`

**Q: Как изменить цены?**
A: Отредактируйте `shared/config.ts` в объекте `TOKEN_PRICING`

**Q: Как добавить новый пакет токенов?**
A: Добавьте в `PAYMENT_PACKAGES` в `shared/config.ts`

**Q: Как протестировать платежи?**
A: Используйте тестовый ключ Яндекс.Касса (уже установлен)

**Q: Как посмотреть данные пользователей?**
A: Откройте Notion таблицу или запросите БД напрямую

## Следующие шаги

1. **Для разработки**: Запустите `pnpm dev` и начните тестировать
2. **Для production**: Следуйте инструкциям в `DEPLOYMENT.md`
3. **Для webhook**: Следуйте инструкциям в `WEBHOOK_SETUP.md`
4. **Для API**: Посмотрите `API_DOCUMENTATION.md`

## Поддержка

Если что-то не работает:

1. Проверьте логи: `pnpm dev`
2. Проверьте переменные окружения: `echo $TELEGRAM_BOT_TOKEN`
3. Проверьте БД: `mysql -h ... -e "SELECT * FROM telegram_users;"`
4. Проверьте Notion: Откройте базу данных в Notion
5. Посмотрите документацию в `API_DOCUMENTATION.md`

## Лицензия

MIT
