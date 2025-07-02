#!/bin/bash

# Test script for manual cron job triggers
# Make sure to set your environment variables first

# Configuration
API_BASE_URL=${RAILWAY_PUBLIC_DOMAIN:-"localhost:5000"}
API_KEY=${DECAY_API_KEY:-"your-api-key-here"}

# Add https:// if using Railway domain
if [[ "$API_BASE_URL" != "localhost"* ]]; then
    API_BASE_URL="https://$API_BASE_URL"
else
    API_BASE_URL="http://$API_BASE_URL"
fi

echo "🧪 Testing Cron Jobs with curl..."
echo "Using API URL: $API_BASE_URL"
echo ""

# Test 1: Manual decay trigger
echo "1️⃣ Testing Manual Decay Processing..."
curl -X POST "$API_BASE_URL/api/cron/trigger-decay" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""
echo ""

# Test 2: Manual match history trigger
echo "2️⃣ Testing Manual Match History Check..."
curl -X POST "$API_BASE_URL/api/cron/trigger-match-history" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""
echo ""

# Test 3: Direct decay processing for NA1
echo "3️⃣ Testing Direct Decay Processing for NA1..."
curl -X POST "$API_BASE_URL/api/accounts/decay/process" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"region": "NA1"}'
echo ""
echo ""

# Test 4: Direct match history check
echo "4️⃣ Testing Direct Match History Check..."
curl -X POST "$API_BASE_URL/api/accounts/decay/check-matches" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""
echo ""

echo "🎉 Cron job tests completed!"
echo ""
echo "📋 Available Manual Triggers:"
echo "   - POST $API_BASE_URL/api/cron/trigger-decay"
echo "   - POST $API_BASE_URL/api/cron/trigger-match-history"
echo "   - POST $API_BASE_URL/api/accounts/decay/process (with region)"
echo "   - POST $API_BASE_URL/api/accounts/decay/check-matches" 
