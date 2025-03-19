#!/bin/bash

# Define directory and file paths
GITHUB_DIR=".github"
WORKFLOWS_DIR="$GITHUB_DIR/workflows"
CI_FILE="$WORKFLOWS_DIR/CI.yml"

# Create directories if they don't exist
mkdir -p "$WORKFLOWS_DIR"

# Check if CI.yml already exists
if [ -f "$CI_FILE" ]; then
    echo "CI.yml already exists at $CI_FILE"
    exit 0
fi

# Create CI.yml with deployment configuration
cat > "$CI_FILE" << 'EOL'
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    container: ghcr.io/railwayapp/cli:latest
    env:
      SVC_ID: app-service
      RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
    steps:
      - uses: actions/checkout@v3
      - run: railway up --service=${{ env.SVC_ID }}
EOL

echo "Created CI.yml at $CI_FILE"
echo "Don't forget to set RAILWAY_TOKEN in your GitHub repository secrets!" 