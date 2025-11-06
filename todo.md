# Telegram Video Generator Bot - TODO

## Core Features

### Database Schema
- [x] User table with Telegram ID, balance, stats
- [x] Token transaction table (purchases and usage)
- [x] Video generation history table
- [x] Payment transaction table (Yandex.Kassa)
- [x] Notion sync status table

### Telegram Bot Handlers
- [x] /start command with welcome message and 60 free tokens
- [x] Text to video generation (10 sec - 20 tokens, 15 sec - 25 tokens)
- [x] Image to video generation (same pricing)
- [x] Voice to video generation (same pricing)
- [x] Balance inquiry command
- [x] Buy tokens command with payment packages
- [x] Video quality selection
- [x] Watermark removal option (10 tokens)
- [ ] Video generation history
- [ ] Download generated videos
- [x] Emoji support in all messages

### KIE.AI Integration
- [x] API client setup with authentication
- [x] Text to video endpoint
- [x] Image to video endpoint
- [x] Voice to video endpoint
- [x] Quality parameter handling
- [x] Watermark removal endpoint
- [x] Error handling and retry logic
- [x] Video processing status tracking

### Payment System (Yandex.Kassa)
- [x] Payment initialization
- [x] Token package pricing (500, 1000, 2000, 4000 RUB)
- [x] Payment confirmation webhook
- [x] Token balance update after payment
- [x] Payment history tracking
- [ ] Invoice generation

### Notion Integration
- [x] Notion database creation with schema
- [x] User sync to Notion (real-time)
- [x] Balance tracking in Notion
- [ ] Token purchase history in Notion
- [ ] Token spending history in Notion
- [x] User statistics in Notion
- [x] Automatic updates on every transaction

### User Experience
- [x] Welcome message on first /start
- [x] Balance display on repeat /start
- [x] Balance display after each generation
- [x] Generation status updates
- [x] Error messages with helpful info
- [x] Emoji usage in all messages
- [x] Inline buttons for actions

### Testing & Deployment
- [ ] Test all Telegram commands
- [ ] Test KIE.AI integration
- [ ] Test Yandex.Kassa payments
- [ ] Test Notion sync
- [ ] Deploy to production
- [ ] Monitor bot performance

## Configuration
- All API keys stored in Railway Variables (see RAILWAY_QUICK_START.md)
- Notion Database: https://www.notion.so/GetCreoMan-2a335dc482e18053a289fe51f025675a

## Pricing Structure
- Video 10 sec: 20 tokens
- Video 15 sec: 25 tokens
- Watermark removal: 10 tokens
- Free tokens on first start: 60 tokens
- Token packages: 500 RUB, 1000 RUB, 2000 RUB, 4000 RUB (1 token = 1 RUB)


## Setup & Configuration

### Notion Database Setup
- [x] Create Notion database with proper schema
- [x] Test Notion API connection
- [x] Verify sync functionality

### Webhook Configuration
- [x] Create webhook setup script
- [x] Test webhook endpoints locally
- [x] Document webhook installation steps

### Testing
- [x] Test database operations
- [x] Test API clients (KIE.AI, Yandex.Kassa, Notion)
- [x] Test bot command handlers
- [ ] Test payment flow
- [ ] Test token system
- [ ] End-to-end integration testing

### Production Preparation
- [x] Create deployment automation script
- [x] Create environment configuration template
- [x] Document all setup steps
- [x] Create troubleshooting guide


## Debugging & Fixes

### Issues Found
- [ ] Bot not responding to commands
- [ ] Notion table is empty
- [ ] Check Railway logs for errors
- [ ] Verify webhook is receiving messages
- [ ] Check database connection
- [ ] Verify Notion API integration
- [ ] Test bot handlers locally
