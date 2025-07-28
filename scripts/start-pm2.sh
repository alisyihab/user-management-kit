#!/bin/bash
set -e

echo "🚀 Starting PM2 using ecosystem.config.js..."
pm2 start ecosystem.config.js
