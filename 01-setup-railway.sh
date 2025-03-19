#!/bin/bash

CONFIG_FILE=".railway-services.json"

# Function to check if a service exists
init_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo '{"services": []}' > "$CONFIG_FILE"
    fi
}

service_exists() {
    local service_name=$1
    if [ ! -f "$CONFIG_FILE" ]; then
        return 1
    fi
    grep -q "\"$service_name\"" "$CONFIG_FILE"
    return $?
}

add_service_to_config() {
    local service_name=$1
    if ! service_exists "$service_name"; then
        # Add new service to the JSON array
        local temp_file=$(mktemp)
        jq ".services += [\"$service_name\"]" "$CONFIG_FILE" > "$temp_file"
        mv "$temp_file" "$CONFIG_FILE"
    fi
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI is not installed. Please install it first."
    exit 1
fi

# Initialize config file
init_config

# Initialize Railway project if not already initialized
if ! railway list &> /dev/null; then
    echo "Initializing Railway project..."
    railway init --name "$(basename "$PWD")"
else
    echo "Railway project already initialized"
fi

# Add Postgres service if it doesn't exist
if ! service_exists "postgres"; then
    echo "Adding Postgres service..."
    railway add -d postgres
    add_service_to_config "postgres"
else
    echo "Postgres service already exists"
fi

# Add Redis service if it doesn't exist
if ! service_exists "redis"; then
    echo "Adding Redis service..."
    railway add -d redis
    add_service_to_config "redis"
else
    echo "Redis service already exists"
fi

# Add the application service if it doesn't exist
if ! service_exists "app-service"; then
    echo "Adding application service..."
    railway add --service app-service --variables "MY_SPECIAL_ENV_VAR=1"
    add_service_to_config "app-service"
else
    echo "Application service already exists"
fi

echo "Railway setup completed successfully!" 