/**
 * Bot Handlers Test Suite
 * Tests for all Telegram bot command handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleStartCommand, handleBalanceCommand, handleBuyCommand, handleHelpCommand } from '../botHandlers';
import * as db from '../../db';
import { telegramBotClient } from '../telegramBotClient';

// Mock database functions
vi.mock('../../db', () => ({
  getTelegramUser: vi.fn(),
  createTelegramUser: vi.fn(),
  addTokensToUser: vi.fn(),
  deductTokensFromUser: vi.fn(),
}));

// Mock Telegram client
vi.mock('../telegramBotClient', () => ({
  telegramBotClient: {
    sendWelcomeMessage: vi.fn(),
    sendBalanceMessage: vi.fn(),
    sendPaymentPackages: vi.fn(),
    sendHelpMessage: vi.fn(),
    sendErrorMessage: vi.fn(),
  },
}));

// Mock Notion client
vi.mock('../notionClient', () => ({
  notionClient: {
    syncUserToNotion: vi.fn(),
  },
}));

describe('Bot Handlers', () => {
  const chatId = 123456;
  const userId = 987654;
  const firstName = 'John';
  const username = 'johndoe';
  const lastName = 'Doe';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleStartCommand', () => {
    it('should create new user with 60 free tokens', async () => {
      // Mock: user doesn't exist
      vi.mocked(db.getTelegramUser).mockResolvedValueOnce(undefined);
      vi.mocked(db.createTelegramUser).mockResolvedValueOnce({
        id: 1,
        telegramId: userId.toString(),
        username,
        firstName,
        lastName,
        tokenBalance: 60,
        totalTokensPurchased: 0,
        totalTokensSpent: 0,
        totalGenerations: 0,
        isActive: true,
        lastInteractionAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await handleStartCommand(chatId, userId, firstName, username, lastName);

      expect(db.createTelegramUser).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramId: userId.toString(),
          tokenBalance: 60,
        })
      );

      expect(telegramBotClient.sendWelcomeMessage).toHaveBeenCalledWith(chatId, firstName);
    });

    it('should show balance for returning user', async () => {
      const existingUser = {
        id: 1,
        telegramId: userId.toString(),
        username,
        firstName,
        lastName,
        tokenBalance: 40,
        totalTokensPurchased: 0,
        totalTokensSpent: 20,
        totalGenerations: 1,
        isActive: true,
        lastInteractionAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getTelegramUser).mockResolvedValueOnce(existingUser);

      await handleStartCommand(chatId, userId, firstName, username, lastName);

      expect(telegramBotClient.sendBalanceMessage).toHaveBeenCalledWith(chatId, 40);
    });
  });

  describe('handleBalanceCommand', () => {
    it('should show user balance', async () => {
      const user = {
        id: 1,
        telegramId: userId.toString(),
        username,
        firstName,
        lastName,
        tokenBalance: 50,
        totalTokensPurchased: 100,
        totalTokensSpent: 50,
        totalGenerations: 2,
        isActive: true,
        lastInteractionAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getTelegramUser).mockResolvedValueOnce(user);

      await handleBalanceCommand(chatId, userId);

      expect(telegramBotClient.sendBalanceMessage).toHaveBeenCalledWith(chatId, 50);
    });

    it('should show error if user not found', async () => {
      vi.mocked(db.getTelegramUser).mockResolvedValueOnce(undefined);

      await handleBalanceCommand(chatId, userId);

      expect(telegramBotClient.sendErrorMessage).toHaveBeenCalledWith(
        chatId,
        'Пользователь не найден. Используйте /start'
      );
    });
  });

  describe('handleBuyCommand', () => {
    it('should show payment packages', async () => {
      const user = {
        id: 1,
        telegramId: userId.toString(),
        username,
        firstName,
        lastName,
        tokenBalance: 50,
        totalTokensPurchased: 100,
        totalTokensSpent: 50,
        totalGenerations: 2,
        isActive: true,
        lastInteractionAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getTelegramUser).mockResolvedValueOnce(user);

      await handleBuyCommand(chatId, userId);

      expect(telegramBotClient.sendPaymentPackages).toHaveBeenCalledWith(chatId);
    });

    it('should show error if user not found', async () => {
      vi.mocked(db.getTelegramUser).mockResolvedValueOnce(undefined);

      await handleBuyCommand(chatId, userId);

      expect(telegramBotClient.sendErrorMessage).toHaveBeenCalledWith(
        chatId,
        'Пользователь не найден. Используйте /start'
      );
    });
  });

  describe('handleHelpCommand', () => {
    it('should send help message', async () => {
      await handleHelpCommand(chatId);

      expect(telegramBotClient.sendHelpMessage).toHaveBeenCalledWith(chatId);
    });
  });
});
