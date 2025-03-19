#!/bin/bash

# Declare array of environment variables
declare -A env_vars=(
    ["APP_ENV"]="production"
    ["PORT"]="3000"
    ["CORS_ORIGIN"]=""
    ["JWT_SECRET_KEY"]="secret123"
    ["IS_ENABLE_DOCS"]="1"

    ["DB_NAME"]='${{Postgres.PGDATABASE}}'
    ["DB_USERNAME"]='${{Postgres.PGUSER}}'
    ["DB_PASSWORD"]='${{Postgres.PGPASSWORD}}'
    ["DB_HOST"]='${{Postgres.PGHOST}}'
    ["DB_PORT"]='${{Postgres.PGPORT}}'
    ["DB_SYNC"]="1"

    ["REDIS_HOST"]='${{Redis.REDISHOST}}'
    ["REDIS_PORT"]='${{Redis.REDISPORT}}'
    ["REDIS_DATABASE"]='1'
    ["REDIS_PASSWORD"]='${{Redis.REDISPASSWORD}}'
    ["REDIS_USERNAME"]='${{Redis.REDISUSER}}'
    ["REDIS_URL"]='${{Redis.REDIS_URL}}'
    ["REDIS_FAMILY"]='0'

    ['IS_WORKER']="1"
    ['IS_API']="1"
    ['IS_BOT']="1"

    ["TELEGRAM_TOKEN"]='7496175761:AAFzSFr731chtcCoskq7alz6UYaoAinCEU0'
    ["DISCORD_TOKEN"]='MTM1MTYxMjMzODc0MjIzMTE0MQ.GjG2S8.xFF7BC5iekU9OQRrG437t-D2mg2lUyF5wsVK1A'

    ["VECTOR_DB_NAME"]='${{pgvector.PGDATABASE}}'
    ["VECTOR_DB_USERNAME"]='${{pgvector.PGUSER}}'
    ["VECTOR_DB_PASSWORD"]='${{pgvector.PGPASSWORD}}'
    ["VECTOR_DB_HOST"]='${{pgvector.PGHOST}}'
    ["VECTOR_DB_PORT"]='${{pgvector.PGPORT}}'

    ["DB_VECTOR_NAME"]='${{pgvector.PGDATABASE}}'
    ["DB_VECTOR_USERNAME"]='${{pgvector.PGUSER}}'
    ["DB_VECTOR_PASSWORD"]='${{pgvector.PGPASSWORD}}'
    ["DB_VECTOR_HOST"]='${{pgvector.PGHOST}}'
    ["DB_VECTOR_PORT"]='${{pgvector.PGPORT}}'

    ["OPEN_AI_API_KEY"]=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
)

# Initialize empty command
command=""

# Build command from array
for key in "${!env_vars[@]}"; do
    value="${env_vars[$key]}"
    
    # Skip if value is empty
    if [[ -z "$value" ]]; then
        continue
    fi
    
    # Append to command
    if [[ -z "$command" ]]; then
        command="railway variables --set '$key=$value'"
    else
        command="$command --set '$key=$value'"
    fi
done

# Print and execute command
echo "Executing: $command"
echo "Press Enter to continue or Ctrl+C to cancel"
read

eval $command 

# Show all variables after setting them
echo -e "\nDisplaying all railway variables:"
railway variables