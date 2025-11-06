/**
 * Shared configuration and constants
 */

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
export const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY || "";
export const YANDEX_KASSA_SHOP_ID = process.env.YANDEX_KASSA_SHOP_ID || "";
export const YANDEX_KASSA_SECRET_KEY = process.env.YANDEX_KASSA_SECRET_KEY || "";
export const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

// Token pricing (in tokens)
export const TOKEN_PRICING = {
  VIDEO_10_SEC: 20,
  VIDEO_15_SEC: 25,
  WATERMARK_REMOVAL: 10,
  FREE_TOKENS_ON_START: 60,
} as const;

// Payment packages (RUB -> Tokens, 1 RUB = 1 token)
export const PAYMENT_PACKAGES = [
  { rubles: 500, tokens: 500, displayName: "500 токенов" },
  { rubles: 1000, tokens: 1000, displayName: "1000 токенов" },
  { rubles: 2000, tokens: 2000, displayName: "2000 токенов" },
  { rubles: 4000, tokens: 4000, displayName: "4000 токенов" },
] as const;

// KIE.AI API configuration
export const KIE_AI_CONFIG = {
  BASE_URL: "https://api.kie.ai",
  ENDPOINTS: {
    TEXT_TO_VIDEO: "/v1/video/generate",
    IMAGE_TO_VIDEO: "/v1/video/generate",
    VOICE_TO_VIDEO: "/v1/video/generate",
    WATERMARK_REMOVAL: "/v1/video/remove-watermark",
    JOB_STATUS: "/v1/jobs",
  },
} as const;

// Yandex.Kassa API configuration
export const YANDEX_KASSA_CONFIG = {
  BASE_URL: "https://api.yookassa.ru/v3",
  ENDPOINTS: {
    CREATE_PAYMENT: "/payments",
    GET_PAYMENT: "/payments",
  },
} as const;

// Notion configuration
export const NOTION_CONFIG = {
  BASE_URL: "https://api.notion.com/v1",
  VERSION: "2022-06-28",
} as const;

// Video generation parameters
export const VIDEO_PARAMS = {
  DURATIONS: ["10", "15"] as const,
  QUALITIES: ["low", "standard", "high"] as const,
  DEFAULT_QUALITY: "standard",
} as const;

// Emoji mappings for Telegram messages
export const EMOJI = {
  WELCOME: "👋",
  BALANCE: "💰",
  VIDEO: "🎬",
  PAYMENT: "💳",
  SUCCESS: "✅",
  ERROR: "❌",
  LOADING: "⏳",
  WATERMARK: "🎨",
  TOKENS: "🪙",
  HISTORY: "📜",
  SETTINGS: "⚙️",
  DOWNLOAD: "⬇️",
  QUALITY: "🎥",
} as const;
