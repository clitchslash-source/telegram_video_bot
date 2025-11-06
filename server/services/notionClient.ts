import axios, { AxiosInstance } from "axios";
import { NOTION_API_KEY, NOTION_DATABASE_ID, NOTION_CONFIG } from "../../shared/config";

interface NotionUser {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  currentBalance: number;
  totalTokensPurchased: number;
  totalTokensSpent: number;
  totalGenerations: number;
  lastInteractionAt: string;
  createdAt: string;
}

class NotionClient {
  private client: AxiosInstance;
  private databaseId: string;

  constructor() {
    this.databaseId = NOTION_DATABASE_ID;

    this.client = axios.create({
      baseURL: NOTION_CONFIG.BASE_URL,
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_CONFIG.VERSION,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Create or update user record in Notion
   */
  async syncUserToNotion(user: NotionUser): Promise<string> {
    try {
      // First, try to find existing record
      const existingPageId = await this.findUserPage(user.telegramId);

      if (existingPageId) {
        // Update existing page
        await this.updateUserPage(existingPageId, user);
        return existingPageId;
      } else {
        // Create new page
        const pageId = await this.createUserPage(user);
        return pageId;
      }
    } catch (error) {
      console.error("[Notion] User sync error:", error);
      throw new Error(`Failed to sync user to Notion: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Find user page by Telegram ID
   */
  private async findUserPage(telegramId: string): Promise<string | null> {
    try {
      const response = await this.client.post("/databases/" + this.databaseId + "/query", {
        filter: {
          property: "Telegram ID",
          rich_text: {
            equals: telegramId,
          },
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].id;
      }

      return null;
    } catch (error) {
      console.error("[Notion] Find user page error:", error);
      return null;
    }
  }

  /**
   * Create new user page in Notion
   */
  private async createUserPage(user: NotionUser): Promise<string> {
    try {
      const response = await this.client.post("/pages", {
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          "Telegram ID": {
            title: [
              {
                text: {
                  content: user.telegramId,
                },
              },
            ],
          },
          "Username": {
            rich_text: [
              {
                text: {
                  content: user.username || "",
                },
              },
            ],
          },
          "First Name": {
            rich_text: [
              {
                text: {
                  content: user.firstName || "",
                },
              },
            ],
          },
          "Last Name": {
            rich_text: [
              {
                text: {
                  content: user.lastName || "",
                },
              },
            ],
          },
          "Current Balance": {
            number: user.currentBalance,
          },
          "Total Purchased": {
            number: user.totalTokensPurchased,
          },
          "Total Spent": {
            number: user.totalTokensSpent,
          },
          "Total Generations": {
            number: user.totalGenerations,
          },
          "Last Interaction": {
            date: {
              start: user.lastInteractionAt,
            },
          },
          "Created At": {
            date: {
              start: user.createdAt,
            },
          },
        },
      });

      return response.data.id;
    } catch (error) {
      console.error("[Notion] Create user page error:", error);
      throw error;
    }
  }

  /**
   * Update existing user page in Notion
   */
  private async updateUserPage(pageId: string, user: NotionUser): Promise<void> {
    try {
      await this.client.patch(`/pages/${pageId}`, {
        properties: {
          "Username": {
            rich_text: [
              {
                text: {
                  content: user.username || "",
                },
              },
            ],
          },
          "First Name": {
            rich_text: [
              {
                text: {
                  content: user.firstName || "",
                },
              },
            ],
          },
          "Last Name": {
            rich_text: [
              {
                text: {
                  content: user.lastName || "",
                },
              },
            ],
          },
          "Current Balance": {
            number: user.currentBalance,
          },
          "Total Purchased": {
            number: user.totalTokensPurchased,
          },
          "Total Spent": {
            number: user.totalTokensSpent,
          },
          "Total Generations": {
            number: user.totalGenerations,
          },
          "Last Interaction": {
            date: {
              start: user.lastInteractionAt,
            },
          },
        },
      });
    } catch (error) {
      console.error("[Notion] Update user page error:", error);
      throw error;
    }
  }

  /**
   * Add transaction record to Notion
   */
  async addTransactionToNotion(telegramId: string, type: string, amount: number, description: string): Promise<void> {
    try {
      // This would require a separate transactions database in Notion
      // For now, we'll just log it
      console.log(`[Notion] Transaction: ${telegramId} - ${type} - ${amount} tokens - ${description}`);
    } catch (error) {
      console.error("[Notion] Add transaction error:", error);
    }
  }
}

export const notionClient = new NotionClient();
