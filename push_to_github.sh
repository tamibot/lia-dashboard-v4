#!/bin/bash
echo "Setting up remote..."
git remote add origin https://github.com/Antigravity-google/lia-dashboard-v4.git 2>/dev/null || git remote set-url origin https://github.com/Antigravity-google/lia-dashboard-v4.git

echo "Renaming branch to main..."
git branch -M main

echo "Pushing to GitHub..."
echo "NOTE: If this fails, you need to create the 'lia-dashboard-v4' repository on GitHub first!"
git push -u origin main
