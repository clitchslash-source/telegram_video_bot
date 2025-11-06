#!/bin/bash

###############################################################################
# Telegram Video Generator Bot - Railway Setup Script
# 
# This script prepares your project for Railway deployment
# 
# Usage: bash scripts/setup-railway.sh
#
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

###############################################################################
# Check Git
###############################################################################

check_git() {
    print_header "Step 1: Checking Git"
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_success "Git is installed: $(git --version)"
}

###############################################################################
# Initialize Git Repository
###############################################################################

init_git() {
    print_header "Step 2: Initializing Git Repository"
    
    if [ -d ".git" ]; then
        print_info "Git repository already initialized"
        return
    fi
    
    git init
    print_success "Git repository initialized"
}

###############################################################################
# Add .gitignore
###############################################################################

add_gitignore() {
    print_header "Step 3: Creating .gitignore"
    
    if [ -f ".gitignore" ]; then
        print_info ".gitignore already exists"
        return
    fi
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
pnpm-lock.yaml
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.db
*.sqlite
*.sqlite3

# OS
.DS_Store
Thumbs.db

# Railway
.railway/
EOF
    
    print_success ".gitignore created"
}

###############################################################################
# Add files to Git
###############################################################################

add_files() {
    print_header "Step 4: Adding Files to Git"
    
    git add .
    print_success "Files added to staging area"
}

###############################################################################
# Create initial commit
###############################################################################

create_commit() {
    print_header "Step 5: Creating Initial Commit"
    
    if git rev-parse --git-dir > /dev/null 2>&1; then
        if git diff-index --quiet HEAD --; then
            print_info "No changes to commit"
            return
        fi
    fi
    
    git commit -m "Initial commit: Telegram video generator bot"
    print_success "Initial commit created"
}

###############################################################################
# Display Railway instructions
###############################################################################

display_instructions() {
    print_header "🚀 Railway Deployment Instructions"
    
    echo -e "${GREEN}Your project is ready for Railway deployment!${NC}\n"
    
    echo "📋 Next steps:\n"
    
    echo "1. Create a GitHub repository:"
    echo "   - Go to https://github.com/new"
    echo "   - Create a new repository named 'telegram_video_bot'"
    echo "   - Do NOT initialize with README, .gitignore, or license\n"
    
    echo "2. Add GitHub remote and push code:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/telegram_video_bot.git"
    echo "   git branch -M main"
    echo "   git push -u origin main\n"
    
    echo "3. Deploy to Railway:"
    echo "   - Go to https://railway.app"
    echo "   - Click 'Create New Project'"
    echo "   - Select 'Deploy from GitHub'"
    echo "   - Select 'telegram_video_bot' repository"
    echo "   - Click 'Deploy'\n"
    
    echo "4. Add environment variables on Railway:"
    echo "   - Go to your Railway project"
    echo "   - Click 'Variables'"
    echo "   - Add all required variables (see RAILWAY_DEPLOYMENT.md)\n"
    
    echo "5. Add MySQL database:"
    echo "   - Click 'Add Service'"
    echo "   - Select 'MySQL'"
    echo "   - Railway will automatically set DATABASE_URL\n"
    
    echo "6. Get your domain and set webhook:"
    echo "   - Go to 'Deployments'"
    echo "   - Copy your domain (e.g., telegram-video-bot-production.up.railway.app)"
    echo "   - Run: bash scripts/set-webhook.sh\n"
    
    echo -e "${GREEN}For detailed instructions, see RAILWAY_DEPLOYMENT.md${NC}\n"
}

###############################################################################
# Main
###############################################################################

main() {
    print_header "Telegram Video Generator Bot - Railway Setup"
    
    check_git
    init_git
    add_gitignore
    add_files
    create_commit
    display_instructions
    
    print_success "Setup complete!"
}

main "$@"
