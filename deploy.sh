#!/bin/bash
set -e

# ==============================================================================
# MAQE Engineering Intelligence Platform - Production Deployment Protocol
# Deploys both to StackCP Server (https://jethrowatson.co.uk/maqe/)
# and GitHub Pages (https://jethrowatson.github.io/maqe/)
# ==============================================================================

REMOTE_USER="jethrowatson.co.uk"
REMOTE_HOST="ssh.gb.stackcp.com"
SSH_KEY="$HOME/.ssh/uk2_deploy_key"
TARGET_DIR="public_html/maqe/"

echo "🚀 Starting MAQE production deployment..."
echo "📍 Source directory: $(pwd)"

# 1. Compile production static export
echo "📦 Compiling production static export..."
npm run build

if [ ! -d "out" ]; then
    echo "❌ Build directory 'out' does not exist! Deployment aborted."
    exit 1
fi

# 2. Deploy to remote StackCP host
if [ -f "$SSH_KEY" ]; then
    echo "📁 Ensuring remote directories exist on $REMOTE_HOST..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $TARGET_DIR"

    echo "📤 Syncing production frontend build to $TARGET_DIR..."
    rsync -avz --delete \
        --exclude "api" \
        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15" \
        out/ "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR"

    # Ensure API files are in place
    echo "📤 Syncing API backend..."
    rsync -avz \
        -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15" \
        db/api/ "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR/api/"

    echo "🎉 Live Remote Deployment Successful!"
    echo "🔗 Live URL: https://jethrowatson.co.uk/maqe/"
fi

echo "✅ MAQE deployment complete."
