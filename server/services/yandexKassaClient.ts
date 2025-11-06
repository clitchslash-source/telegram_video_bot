import axios, { AxiosInstance } from "axios";
import { YANDEX_KASSA_CONFIG, YANDEX_KASSA_SHOP_ID, YANDEX_KASSA_SECRET_KEY } from "../../shared/config";

interface CreatePaymentRequest {
  amount: number; // in rubles
  tokens: number;
  telegramId: string;
  description: string;
  returnUrl: string;
}

interface CreatePaymentResponse {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  confirmation: {
    type: string;
    confirmationUrl: string;
  };
  created_at: string;
}

interface GetPaymentResponse {
  id: string;
  status: "pending" | "succeeded" | "canceled";
  amount: {
    value: string;
    currency: string;
  };
  payment_method?: {
    type: string;
  };
  created_at: string;
  captured_at?: string;
}

class YandexKassaClient {
  private client: AxiosInstance;
  private shopId: string;
  private secretKey: string;

  constructor() {
    this.shopId = YANDEX_KASSA_SHOP_ID;
    this.secretKey = YANDEX_KASSA_SECRET_KEY;

    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString("base64");

    this.client = axios.create({
      baseURL: YANDEX_KASSA_CONFIG.BASE_URL,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Idempotency-Key": this.generateIdempotencyKey(),
      },
      timeout: 30000,
    });
  }

  /**
   * Create payment for token purchase
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const payload = {
        amount: {
          value: request.amount.toFixed(2),
          currency: "RUB",
        },
        payment_method_data: {
          type: "bank_card",
        },
        confirmation: {
          type: "redirect",
          return_url: request.returnUrl,
        },
        metadata: {
          telegramId: request.telegramId,
          tokens: request.tokens,
        },
        description: request.description,
      };

      const response = await this.client.post(
        YANDEX_KASSA_CONFIG.ENDPOINTS.CREATE_PAYMENT,
        payload
      );

      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        confirmation: response.data.confirmation,
        created_at: response.data.created_at,
      };
    } catch (error) {
      console.error("[Yandex.Kassa] Payment creation error:", error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get payment status
   */
  async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    try {
      const response = await this.client.get(
        `${YANDEX_KASSA_CONFIG.ENDPOINTS.GET_PAYMENT}/${paymentId}`
      );

      return {
        id: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        payment_method: response.data.payment_method,
        created_at: response.data.created_at,
        captured_at: response.data.captured_at,
      };
    } catch (error) {
      console.error("[Yandex.Kassa] Payment status check error:", error);
      throw new Error(`Failed to get payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha256", this.secretKey)
        .update(body)
        .digest("base64");

      return hash === signature;
    } catch (error) {
      console.error("[Yandex.Kassa] Webhook verification error:", error);
      return false;
    }
  }

  /**
   * Generate unique idempotency key
   */
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const yandexKassaClient = new YandexKassaClient();
