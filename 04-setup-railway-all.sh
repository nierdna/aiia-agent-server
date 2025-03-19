#!/bin/bash

CONFIG_FILE=".railway-services.json"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI is not installed. Please install it first."
    exit 1
fi

echo "Step 1: Running initial Railway setup..."
./01-setup-railway.sh
if [ $? -ne 0 ]; then
    echo "Error: Initial Railway setup failed"
    exit 1
fi

echo -e "\nStep 2: Setting Railway variables..."
./02-set-railway-vars.sh
if [ $? -ne 0 ]; then
    echo "Error: Setting Railway variables failed"
    exit 1
fi

echo -e "\nStep 3: Deploying application..."
railway up
if [ $? -ne 0 ]; then
    echo "Error: Deployment failed"
    exit 1
fi

echo -e "\nStep 4: Setting up domain..."
# Capture the domain output
DOMAIN_OUTPUT=$(railway domain)
if [ $? -ne 0 ]; then
    echo "Error: Domain setup failed"
    exit 1
fi

echo -e "\nStep 5: Setting up GitHub Actions..."
./03-setup-github-actions.sh
if [ $? -ne 0 ]; then
    echo "Error: GitHub Actions setup failed"
    exit 1
fi

# Extract domain URL from the output
DOMAIN_URL=$(echo "$DOMAIN_OUTPUT" | grep "https://" | tr -d '[:space:]')

# Update config file with domain
if [ -f "$CONFIG_FILE" ]; then
    # Create temporary file
    temp_file=$(mktemp)
    
    # Add domain to JSON config
    jq --arg domain "$DOMAIN_URL" '. + {"domain": $domain}' "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
    
    echo -e "\nDomain saved to config: $DOMAIN_URL"
else
    echo "Warning: Config file not found, creating new one with domain"
    echo "{\"services\": [], \"domain\": \"$DOMAIN_URL\"}" > "$CONFIG_FILE"
fi

echo -e "\nSetup completed successfully!"
echo "Your application is deployed at: $DOMAIN_URL"

# Display final configuration
echo -e "\nFinal configuration:"
cat "$CONFIG_FILE" 