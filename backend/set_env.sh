#!/bin/bash

# VCP Backend Environment Setup
# Source this file to set up environment variables
# Usage: source set_env.sh

echo "🔧 Setting VCP Backend environment variables..."

# Flask Configuration
export SECRET_KEY="dev-secret-key-change-in-production-abc123xyz789"
export JWT_SECRET_KEY="dev-jwt-secret-key-change-in-production-xyz789abc123"
export DEBUG="True"

# Database Configuration
export DATABASE_URL="postgresql://vcp_user:vcp_password@localhost:5432/vcp_database"

# CORS Configuration
export CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# JWT Token Expiration (in seconds)
export JWT_ACCESS_TOKEN_EXPIRES="3600"
export JWT_REFRESH_TOKEN_EXPIRES="2592000"

# Server Port
export PORT="5002"

# Email Configuration
export SENDER_EMAIL="noreply@vcpapp.com"
export SENDER_NAME="VCP App"

echo "✅ Environment variables set successfully!"
echo "🌐 Database: $DATABASE_URL"
echo "🔧 Debug mode: $DEBUG"
echo "🚪 Port: $PORT"
