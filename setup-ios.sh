#!/bin/bash

# ClubWiz Admin Mobile - iOS Setup Script
# This script properly configures iOS for Capacitor builds

set -e

echo "🍎 ClubWiz Admin Mobile - iOS Capacitor Setup"
echo "=============================================="

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
IOS_DIR="$PROJECT_ROOT/ios/App"

# Check if pod install is needed
echo ""
echo "📦 Setting up iOS dependencies..."

if [ ! -d "$IOS_DIR/Pods" ]; then
  echo "Installing CocoaPods dependencies..."
  cd "$IOS_DIR"
  
  # Check if Podfile exists
  if [ ! -f "Podfile" ]; then
    echo "❌ Error: Podfile not found in $IOS_DIR"
    echo "   Please ensure Podfile exists"
    exit 1
  fi
  
  # Install pods
  pod install
  
  if [ $? -ne 0 ]; then
    echo "❌ pod install failed"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Ensure CocoaPods is installed: brew install cocoapods"
    echo "2. Update CocoaPods: sudo gem install cocoapods"
    echo "3. Clear pod cache: pod deintegrate && rm -rf Pods Podfile.lock"
    echo "4. Try again: pod install"
    exit 1
  fi
  
  cd "$PROJECT_ROOT"
else
  echo "✅ Pods already installed"
fi

# Verify xcworkspace was created
if [ ! -f "$IOS_DIR/App.xcworkspace/contents.xcworkspacedata" ]; then
  echo "❌ Error: App.xcworkspace was not created"
  exit 1
fi

echo ""
echo "✅ iOS setup complete!"
echo ""
echo "📝 To build iOS app:"
echo "   1. npx cap sync ios       (sync web assets)"
echo "   2. npx cap open ios       (open in Xcode)"
echo ""
echo "📝 Or use Xcode directly:"
echo "   open $IOS_DIR/App.xcworkspace"
