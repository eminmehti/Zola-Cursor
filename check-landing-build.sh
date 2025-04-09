#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")"

echo "Checking landing page build..."

# Check if dist directory exists
if [ ! -d "landing-page/dist" ]; then
  echo "Error: dist directory not found!"
  echo "Building the landing page..."
  cd landing-page
  npm run build
  cd ..
else
  echo "✓ dist directory exists"
fi

# Check if public directory exists
if [ ! -d "landing-page/dist/public" ]; then
  echo "Error: dist/public directory not found!"
  echo "Rebuilding the landing page..."
  cd landing-page
  npm run build
  cd ..
else
  echo "✓ dist/public directory exists"
fi

# Check if index.html exists
if [ ! -f "landing-page/dist/public/index.html" ]; then
  echo "Error: index.html not found in dist/public!"
  echo "Rebuilding the landing page..."
  cd landing-page
  npm run build
  cd ..
else
  echo "✓ index.html exists"
fi

# Check if assets directory exists
if [ ! -d "landing-page/dist/public/assets" ]; then
  echo "Error: assets directory not found in dist/public!"
  echo "Check the Vite build configuration"
else
  echo "✓ assets directory exists"
  # Count files in assets directory
  asset_count=$(find landing-page/dist/public/assets -type f | wc -l)
  echo "  Found $asset_count files in assets directory"
fi

# Print relevant sections of index.html
if [ -f "landing-page/dist/public/index.html" ]; then
  echo "Checking index.html scripts and links..."
  
  # Extract script sources
  scripts=$(grep -o '<script[^>]*src="[^"]*"[^>]*>' landing-page/dist/public/index.html)
  if [ -n "$scripts" ]; then
    echo "Scripts found:"
    echo "$scripts"
  else
    echo "No scripts found in index.html!"
  fi
  
  # Extract CSS links
  styles=$(grep -o '<link[^>]*rel="stylesheet"[^>]*>' landing-page/dist/public/index.html)
  if [ -n "$styles" ]; then
    echo "Stylesheets found:"
    echo "$styles"
  else
    echo "No stylesheets found in index.html!"
  fi
fi

echo "Build check complete." 