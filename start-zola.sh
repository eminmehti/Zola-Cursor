#!/bin/bash

# Output with colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Change to the project directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Stop any existing node processes for our servers
print_status "Stopping any existing servers..."
pkill -f "node server.js" || true
pkill -f "node zola-server.js" || true

# Kill any processes running on ports 2000 and 3000
lsof -ti:2000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

print_success "Cleaned up existing processes"

# Build the landing page
print_status "Building the landing page..."
cd landing-page
if npm run build; then
  print_success "Landing page built successfully"
else
  print_error "Failed to build landing page"
  exit 1
fi
cd "$PROJECT_ROOT"

# Verify the build output
if [ ! -d "landing-page/dist/public" ] || [ ! -f "landing-page/dist/public/index.html" ]; then
  print_error "Landing page build files are missing!"
  exit 1
fi

# Start the Stage-2 server in the background
print_status "Starting Stage-2 server on port 2000..."
cd Stage-2
node server.js > /dev/null 2>&1 &
STAGE2_PID=$!
cd "$PROJECT_ROOT"

# Wait a bit for Stage-2 to start up
sleep 2

# Check if Stage-2 server is running
if ! lsof -ti:2000 > /dev/null; then
  print_error "Stage-2 server failed to start on port 2000"
  exit 1
fi

print_success "Stage-2 server started successfully"

# Start the integration server
print_status "Starting integration server on port 3000..."
node zola-server.js &
ZOLA_PID=$!

# Wait a bit to let the server start
sleep 2

# Check if the integration server is running
if ! lsof -ti:3000 > /dev/null; then
  print_error "Integration server failed to start on port 3000"
  kill $STAGE2_PID
  exit 1
fi

print_success "Integration server started successfully"
print_success "Your application is now running!"
echo -e "${GREEN}======================================${NC}"
echo -e "Landing page: ${BLUE}http://localhost:3000${NC}"
echo -e "Stage-2 app:  ${BLUE}http://localhost:3000/stage2${NC}"
echo -e "${GREEN}======================================${NC}"

# Wait for user input to terminate
echo ""
read -p "Press Enter to stop all servers..." INPUT

# Cleanup
print_status "Stopping servers..."
kill $STAGE2_PID $ZOLA_PID

print_success "All servers stopped" 