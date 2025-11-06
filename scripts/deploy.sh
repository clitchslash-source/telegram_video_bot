#!/bin/bash

###############################################################################
# Telegram Video Generator Bot - Automated Deployment Script
# 
# Usage: bash deploy.sh
# 
# This script will:
# 1. Install Node.js and pnpm
# 2. Clone the project
# 3. Install dependencies
# 4. Initialize database
# 5. Install and configure Nginx
# 6. Install SSL certificate (Let's Encrypt)
# 7. Start the application with PM2
# 8. Configure Telegram webhook
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="${REPO_URL:-https://github.com/your-username/telegram_video_bot.git}"
DOMAIN="${DOMAIN:-}"
TELEGRAM_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
PROJECT_DIR="/home/ubuntu/telegram_video_bot"
APP_USER="ubuntu"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

###############################################################################
# Step 1: Update System
###############################################################################

step_update_system() {
    print_header "Step 1: Updating System"
    
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git build-essential
    
    print_success "System updated"
}

###############################################################################
# Step 2: Install Node.js and pnpm
###############################################################################

step_install_nodejs() {
    print_header "Step 2: Installing Node.js and pnpm"
    
    if check_command node; then
        print_info "Node.js already installed: $(node --version)"
    else
        print_info "Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        print_success "Node.js installed: $(node --version)"
    fi
    
    if check_command pnpm; then
        print_info "pnpm already installed: $(pnpm --version)"
    else
        print_info "Installing pnpm..."
        npm install -g pnpm
        print_success "pnpm installed: $(pnpm --version)"
    fi
}

###############################################################################
# Step 3: Clone Project
###############################################################################

step_clone_project() {
    print_header "Step 3: Cloning Project"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "Project directory already exists, skipping clone"
        return
    fi
    
    print_info "Cloning from: $REPO_URL"
    git clone "$REPO_URL" "$PROJECT_DIR"
    
    chown -R "$APP_USER:$APP_USER" "$PROJECT_DIR"
    print_success "Project cloned to $PROJECT_DIR"
}

###############################################################################
# Step 4: Install Dependencies
###############################################################################

step_install_dependencies() {
    print_header "Step 4: Installing Dependencies"
    
    cd "$PROJECT_DIR"
    sudo -u "$APP_USER" pnpm install
    
    print_success "Dependencies installed"
}

###############################################################################
# Step 5: Initialize Database
###############################################################################

step_init_database() {
    print_header "Step 5: Initializing Database"
    
    cd "$PROJECT_DIR"
    
    print_info "Checking database connection..."
    if sudo -u "$APP_USER" pnpm db:push; then
        print_success "Database initialized"
    else
        print_error "Database initialization failed"
        print_info "Make sure DATABASE_URL is set correctly"
        return 1
    fi
}

###############################################################################
# Step 6: Install PM2
###############################################################################

step_install_pm2() {
    print_header "Step 6: Installing PM2"
    
    if check_command pm2; then
        print_info "PM2 already installed: $(pm2 --version)"
    else
        print_info "Installing PM2..."
        npm install -g pm2
        print_success "PM2 installed"
    fi
    
    # Start application with PM2
    cd "$PROJECT_DIR"
    sudo -u "$APP_USER" pm2 start "pnpm start" --name "telegram-video-bot"
    sudo -u "$APP_USER" pm2 save
    pm2 startup systemd -u "$APP_USER" --hp /home/"$APP_USER"
    
    print_success "Application started with PM2"
}

###############################################################################
# Step 7: Install Nginx
###############################################################################

step_install_nginx() {
    print_header "Step 7: Installing Nginx"
    
    if check_command nginx; then
        print_info "Nginx already installed"
    else
        apt-get install -y nginx
        systemctl enable nginx
        print_success "Nginx installed"
    fi
}

###############################################################################
# Step 8: Install SSL Certificate
###############################################################################

step_install_ssl() {
    print_header "Step 8: Installing SSL Certificate"
    
    if [ -z "$DOMAIN" ]; then
        print_warning "DOMAIN not set, skipping SSL installation"
        print_info "To install SSL later, run:"
        print_info "  sudo certbot certonly --nginx -d your-domain.com"
        return
    fi
    
    if check_command certbot; then
        print_info "Certbot already installed"
    else
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    print_info "Installing SSL certificate for $DOMAIN..."
    certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN"
    
    print_success "SSL certificate installed"
}

###############################################################################
# Step 9: Configure Nginx
###############################################################################

step_configure_nginx() {
    print_header "Step 9: Configuring Nginx"
    
    if [ -z "$DOMAIN" ]; then
        print_warning "DOMAIN not set, skipping Nginx configuration"
        return
    fi
    
    # Create Nginx config
    cat > /etc/nginx/sites-available/telegram-bot << 'EOF'
upstream telegram_bot {
    server localhost:3000;
}

server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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
EOF
    
    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/telegram-bot
    
    # Enable site
    ln -sf /etc/nginx/sites-available/telegram-bot /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    
    print_success "Nginx configured for $DOMAIN"
}

###############################################################################
# Step 10: Setup Telegram Webhook
###############################################################################

step_setup_webhook() {
    print_header "Step 10: Setting up Telegram Webhook"
    
    if [ -z "$DOMAIN" ] || [ -z "$TELEGRAM_TOKEN" ]; then
        print_warning "DOMAIN or TELEGRAM_TOKEN not set, skipping webhook setup"
        print_info "To setup webhook later, run:"
        print_info "  curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \\"
        print_info "    -H 'Content-Type: application/json' \\"
        print_info "    -d '{\"url\": \"https://{DOMAIN}/api/telegram/webhook\"}'"
        return
    fi
    
    print_info "Setting webhook for $DOMAIN..."
    
    WEBHOOK_URL="https://$DOMAIN/api/telegram/webhook"
    
    RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$WEBHOOK_URL\", \"allowed_updates\": [\"message\", \"callback_query\"]}")
    
    if echo "$RESPONSE" | grep -q '"ok":true'; then
        print_success "Webhook installed: $WEBHOOK_URL"
    else
        print_error "Failed to install webhook"
        print_info "Response: $RESPONSE"
        return 1
    fi
}

###############################################################################
# Step 11: Verify Installation
###############################################################################

step_verify() {
    print_header "Step 11: Verifying Installation"
    
    print_info "Checking Node.js..."
    node --version
    
    print_info "Checking pnpm..."
    pnpm --version
    
    print_info "Checking PM2..."
    pm2 --version
    
    print_info "Checking Nginx..."
    nginx -v
    
    print_info "Checking application status..."
    pm2 status
    
    if [ -n "$DOMAIN" ]; then
        print_info "Checking webhook status..."
        curl -s "https://api.telegram.org/bot$TELEGRAM_TOKEN/getWebhookInfo" | grep -o '"url":"[^"]*"'
    fi
    
    print_success "Installation verified"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    print_header "Telegram Video Generator Bot - Automated Deployment"
    
    # Check if running as root
    check_root
    
    # Get configuration from environment or user input
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain (e.g., bot.example.com): " DOMAIN
    fi
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        read -p "Enter your Telegram Bot Token: " TELEGRAM_TOKEN
    else
        TELEGRAM_TOKEN="$TELEGRAM_BOT_TOKEN"
    fi
    
    print_info "Configuration:"
    print_info "  Domain: $DOMAIN"
    print_info "  Project Directory: $PROJECT_DIR"
    print_info "  Repository: $REPO_URL"
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 1
    fi
    
    # Execute steps
    step_update_system
    step_install_nodejs
    step_clone_project
    step_install_dependencies
    step_init_database
    step_install_pm2
    step_install_nginx
    step_install_ssl
    step_configure_nginx
    step_setup_webhook
    step_verify
    
    # Final message
    print_header "🎉 Deployment Complete!"
    
    echo -e "${GREEN}Your Telegram bot is now running!${NC}\n"
    
    echo "📋 Next steps:"
    echo "  1. Open Telegram and find your bot"
    echo "  2. Send /start command"
    echo "  3. You should receive a welcome message with 60 free tokens"
    echo ""
    echo "📊 Monitor your bot:"
    echo "  pm2 logs telegram-video-bot"
    echo ""
    echo "📚 Documentation:"
    echo "  - README.md - Project overview"
    echo "  - QUICK_START.md - Quick start guide"
    echo "  - DEPLOYMENT.md - Deployment details"
    echo "  - API_DOCUMENTATION.md - API reference"
    echo ""
    echo "🔗 Webhook URL: https://$DOMAIN/api/telegram/webhook"
    echo ""
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"
