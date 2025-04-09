#!/bin/bash

# Stop any existing node processes for the Stage-2 server
pkill -f "node server.js" || true

# Kill any processes running on ports 2000 and 3000
lsof -ti:2000 | xargs kill -9 || true
lsof -ti:3000 | xargs kill -9 || true

# Change to the project directory
cd "$(dirname "$0")"

# Build the landing page
echo "Building the landing page..."
cd landing-page
npm run build
cd ..

# Start the Stage-2 server in the background
echo "Starting Stage-2 server..."
cd Stage-2
node server.js &
STAGE2_PID=$!
cd ..

# Wait a bit for Stage-2 to start up
sleep 2

# Start the integration server
echo "Starting integration server..."
node zola-server.js

# Cleanup on exit
trap "kill $STAGE2_PID" EXIT 