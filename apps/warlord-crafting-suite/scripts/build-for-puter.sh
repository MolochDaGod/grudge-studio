#!/bin/bash

echo "Building GRUDGE Warlords for Puter deployment..."

# Build the frontend
npm run build

echo ""
echo "Build complete! Your static files are in: dist/public/"
echo ""
echo "To deploy to Puter:"
echo "1. Go to https://puter.com"
echo "2. Create a Puter account (or sign in)"
echo "3. Upload the entire 'dist/public' folder"
echo "4. Right-click the folder and select 'Publish as Website'"
echo "5. Your app will be live instantly!"
echo ""
echo "Note: The app will use Puter's free AI and cloud storage."
echo "Users login with their Puter account to save characters."
