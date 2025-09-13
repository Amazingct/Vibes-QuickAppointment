#!/bin/bash

# VCP Backend Server Startup Script
# This script sets up the environment and starts the Flask server

echo "🚀 VCP Backend Server Startup"
echo "==============================="

# Kill existing processes on port 5002
echo "🧹 Cleaning up existing backend processes..."
lsof -ti:5002 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ Process cleanup completed"

# Activate conda environment
echo "📦 Activating conda environment 'vcp'..."
source ~/anaconda3/etc/profile.d/conda.sh
conda activate vcp

# Set environment variables
echo "🔧 Setting environment variables..."
export DATABASE_URL="postgresql://vcp_user:vcp_password@localhost:5432/vcp_database"
export SECRET_KEY="dev-secret-key-change-in-production-abc123xyz789"
export JWT_SECRET_KEY="dev-jwt-secret-key-change-in-production-xyz789abc123"
export DEBUG="True"
export CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
export JWT_ACCESS_TOKEN_EXPIRES="3600"
export JWT_REFRESH_TOKEN_EXPIRES="2592000"
export PORT="5002"
export SENDER_EMAIL="noreply@vcpapp.com"
export SENDER_NAME="VCP App"

echo "✅ Environment configured successfully!"
echo "🌐 Database: postgresql://vcp_user:***@localhost:5432/vcp_database"
echo "🔧 Debug mode: $DEBUG"
echo "🚪 Port: $PORT"
echo ""

# Start the Flask server
echo "🚀 Starting Flask server..."
python main.py
