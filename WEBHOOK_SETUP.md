# Telegram Webhook Setup Guide

## Что такое webhook?

Webhook — это способ, которым Telegram отправляет обновления (сообщения, команды, нажатия кнопок) на ваш сервер. Вместо того чтобы постоянно спрашивать Telegram "есть ли новые сообщения?", Telegram сам отправляет их на ваш URL.

## Требования

1. **HTTPS домен** - Telegram требует безопасное соединение
2. **Публичный IP или домен** - Telegram должен иметь доступ к вашему серверу
3. **Открытый порт 443** - Для HTTPS соединения
4. **SSL сертификат** - Для HTTPS

## Шаг 1: Подготовка сервера

### Если у вас уже есть домен и сервер:

```bash
# Убедитесь, что приложение запущено на порту 3000
# и доступно по HTTPS через nginx/apache

# Проверьте, что webhook endpoint работает
curl -X POST https://your-domain.com/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 0, "message": {"text": "/start"}}'
```

### Если у вас нет сервера:

Вы можете использовать:
- **Heroku** (бесплатно, но медленно)
- **Railway** (бесплатно, быстрее)
- **Render** (бесплатно)
- **Replit** (бесплатно)
- **VPS** (платно, но надежнее): Digital Ocean, Linode, AWS, Hetzner

## Шаг 2: Установка webhook

### Способ 1: Через curl (рекомендуется)

```bash
# Замените YOUR_TOKEN на ваш токен бота
# Замените your-domain.com на ваш домен

TOKEN="8531118020:AAEQBjafvKseqz0rBVXlMQFv9vEZdVvRC88"
DOMAIN="your-domain.com"

curl -X POST https://api.telegram.org/bot${TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://${DOMAIN}/api/telegram/webhook\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }"
```

### Способ 2: Через скрипт Node.js

```javascript
// scripts/set-webhook.mjs
import axios from 'axios';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DOMAIN = process.env.WEBHOOK_DOMAIN;

if (!TOKEN || !DOMAIN) {
  console.error('Missing TELEGRAM_BOT_TOKEN or WEBHOOK_DOMAIN');
  process.exit(1);
}

const url = `https://api.telegram.org/bot${TOKEN}/setWebhook`;

axios.post(url, {
  url: `https://${DOMAIN}/api/telegram/webhook`,
  allowed_updates: ['message', 'callback_query'],
})
  .then(response => {
    console.log('✅ Webhook установлен успешно!');
    console.log(response.data);
  })
  .catch(error => {
    console.error('❌ Ошибка при установке webhook:');
    console.error(error.response?.data || error.message);
  });
```

Запуск:
```bash
TELEGRAM_BOT_TOKEN="8531118020:AAEQBjafvKseqz0rBVXlMQFv9vEZdVvRC88" \
WEBHOOK_DOMAIN="your-domain.com" \
node scripts/set-webhook.mjs
```

## Шаг 3: Проверка webhook

### Проверка статуса

```bash
TOKEN="8531118020:AAEQBjafvKseqz0rBVXlMQFv9vEZdVvRC88"

curl https://api.telegram.org/bot${TOKEN}/getWebhookInfo
```

Ожидаемый ответ:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "ip_address": "1.2.3.4",
    "last_error_date": null,
    "last_error_message": null,
    "last_synchronization_error_date": null,
    "max_connections": 40,
    "allowed_updates": ["message", "callback_query"]
  }
}
```

### Проверка логов

Проверьте логи сервера на наличие ошибок:

```bash
# Если используете PM2
pm2 logs telegram-video-bot

# Если используете Systemd
sudo journalctl -u telegram-video-bot -f

# Если запускаете локально
npm run dev
```

## Шаг 4: Тестирование webhook

### Локальное тестирование (для разработки)

Используйте **ngrok** для создания публичного URL для локального сервера:

```bash
# Установка ngrok
# https://ngrok.com/download

# Запуск ngrok (проксирует localhost:3000)
ngrok http 3000

# Вы получите URL вроде: https://abc123.ngrok.io
# Используйте его как WEBHOOK_DOMAIN
```

### Отправка тестового сообщения

```bash
TOKEN="8531118020:AAEQBjafvKseqz0rBVXlMQFv9vEZdVvRC88"
DOMAIN="your-domain.com"

# Отправить тестовое сообщение
curl -X POST https://api.telegram.org/bot${TOKEN}/sendMessage \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": YOUR_CHAT_ID,
    "text": "Тестовое сообщение"
  }'
```

## Шаг 5: Отладка проблем

### Webhook не работает

**Проблема**: Telegram не может подключиться к webhook URL

**Решение**:
1. Убедитесь, что HTTPS работает: `curl https://your-domain.com`
2. Проверьте, что порт 443 открыт: `telnet your-domain.com 443`
3. Проверьте SSL сертификат: `openssl s_client -connect your-domain.com:443`
4. Переустановите webhook: `setWebhook`

### Сообщения не приходят

**Проблема**: Webhook установлен, но сообщения не обрабатываются

**Решение**:
1. Проверьте логи сервера на ошибки
2. Убедитесь, что endpoint `/api/telegram/webhook` существует
3. Проверьте, что база данных доступна
4. Отправьте тестовое сообщение и посмотрите логи

### Ошибка "Forbidden"

**Проблема**: Webhook возвращает 403

**Решение**:
1. Проверьте, что приложение запущено
2. Убедитесь, что nginx/apache правильно проксирует запросы
3. Проверьте firewall правила

### Ошибка "Connection refused"

**Проблема**: Telegram не может подключиться к серверу

**Решение**:
1. Убедитесь, что приложение запущено: `ps aux | grep node`
2. Проверьте, что приложение слушает на правильном порту: `netstat -tlnp | grep 3000`
3. Проверьте, что nginx/apache запущены и правильно настроены

## Удаление webhook

Если нужно удалить webhook (например, для переключения на polling):

```bash
TOKEN="8531118020:AAEQBjafvKseqz0rBVXlMQFv9vEZdVvRC88"

curl -X POST https://api.telegram.org/bot${TOKEN}/deleteWebhook
```

## Альтернатива: Polling (вместо webhook)

Если у вас нет возможности использовать webhook, можно использовать polling (постоянный опрос Telegram):

```javascript
// scripts/polling-bot.mjs
import axios from 'axios';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let offset = 0;

async function pollUpdates() {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${TOKEN}/getUpdates`,
      { params: { offset, timeout: 30 } }
    );

    for (const update of response.data.result) {
      console.log('Update:', update);
      offset = update.update_id + 1;
      // Обработка обновления
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  setTimeout(pollUpdates, 1000);
}

pollUpdates();
```

## Лучшие практики

1. **Используйте webhook вместо polling** - Это быстрее и экономнее
2. **Установите timeout для webhook** - Telegram ждет ответа максимум 30 секунд
3. **Обрабатывайте ошибки** - Если что-то пошло не так, логируйте это
4. **Используйте HTTPS** - Telegram требует безопасное соединение
5. **Регулярно проверяйте статус webhook** - Убедитесь, что все работает
6. **Кэшируйте данные** - Не обращайтесь к БД для каждого обновления

## Полезные ссылки

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Webhook vs Polling](https://core.telegram.org/bots/faq#how-do-i-use-a-custom-certificate-with-webhook)
- [SSL Certificates](https://core.telegram.org/bots/self-signed)

## Контрольный список

- [ ] Домен и сервер готовы
- [ ] HTTPS работает
- [ ] Приложение запущено на production
- [ ] Webhook установлен
- [ ] Статус webhook проверен
- [ ] Тестовое сообщение отправлено
- [ ] Логи проверены на ошибки
- [ ] Бот отвечает на команды
