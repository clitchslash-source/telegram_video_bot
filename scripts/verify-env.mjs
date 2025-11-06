#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Checks if all required environment variables are set
 */

const required = [
  'TELEGRAM_BOT_TOKEN',
  'KIE_AI_API_KEY',
  'YANDEX_KASSA_SHOP_ID',
  'YANDEX_KASSA_SECRET_KEY',
  'NOTION_API_KEY',
  'NOTION_DATABASE_ID',
  'DATABASE_URL',
];

const optional = [
  'PORT',
  'NODE_ENV',
  'WEBHOOK_DOMAIN',
];

console.log('🔍 Проверка переменных окружения...\n');

let allValid = true;

console.log('📋 Обязательные переменные:');
for (const key of required) {
  const value = process.env[key];
  if (value) {
    const masked = value.length > 20 ? value.substring(0, 10) + '...' + value.substring(value.length - 5) : value;
    console.log(`  ✅ ${key}: ${masked}`);
  } else {
    console.log(`  ❌ ${key}: НЕ УСТАНОВЛЕНА`);
    allValid = false;
  }
}

console.log('\n📋 Опциональные переменные:');
for (const key of optional) {
  const value = process.env[key];
  if (value) {
    console.log(`  ✅ ${key}: ${value}`);
  } else {
    console.log(`  ⚠️  ${key}: не установлена (используется значение по умолчанию)`);
  }
}

console.log('\n' + '='.repeat(50));

if (allValid) {
  console.log('✅ Все обязательные переменные установлены!');
  console.log('\nВы можете запустить приложение:');
  console.log('  pnpm dev    - для разработки');
  console.log('  pnpm start  - для production');
  process.exit(0);
} else {
  console.log('❌ Некоторые обязательные переменные не установлены!');
  console.log('\nУстановите их:');
  console.log('  export TELEGRAM_BOT_TOKEN="..."');
  console.log('  export KIE_AI_API_KEY="..."');
  console.log('  export YANDEX_KASSA_SHOP_ID="..."');
  console.log('  export YANDEX_KASSA_SECRET_KEY="..."');
  console.log('  export NOTION_API_KEY="..."');
  console.log('  export NOTION_DATABASE_ID="..."');
  console.log('  export DATABASE_URL="..."');
  process.exit(1);
}
