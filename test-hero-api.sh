#!/bin/bash
# Quick test script to verify hero endpoints

echo "Testing Hero API Endpoints..."
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s https://movie-ticket-2-k0ti.onrender.com/api/health | head -20
echo ""
echo ""

# Test 2: Get Hero Settings (Public)
echo "2. Testing GET /api/hero..."
curl -s https://movie-ticket-2-k0ti.onrender.com/api/hero | head -50
echo ""
echo ""

# Test 3: Check if routes are registered
echo "3. All registered routes in Server.js:"
grep -n "app.use.*api" Backend/Server.js
echo ""

echo "✅ If health check works but /api/hero returns 404, restart your backend server!"
echo ""
echo "To restart:"
echo "  cd Backend"
echo "  npm start"
