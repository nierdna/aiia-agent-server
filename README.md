# AIIA Agent Server

A scalable server application built with NestJS for AI-powered agents capable of interacting across multiple platforms including Twitter and Discord.

## Overview

AIIA Agent Server serves as a backend for AI agents that can process natural language, retrieve information from vector databases, and engage with users through various platforms. Built with NestJS, this application offers a robust architecture for managing AI agents, user interactions, and multi-platform integrations.

## Key Features

- **AI Agent Framework**: Configurable AI agents with customizable instructions and tools
- **Multi-Platform Support**: Integration with Twitter and Discord
- **Vector Database**: PgVector implementation for semantic search and document retrieval
- **Authentication**: Secure API endpoints with JWT authentication
- **Scalable Architecture**: Built on NestJS for enterprise-grade scalability

## Technical Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with PgVector extension
- **Authentication**: JWT
- **Containerization**: Docker
- **CI/CD**: GitHub Actions integration with Railway deployment

## Getting Started

### Prerequisites

- Node.js (14+)
- PostgreSQL with PgVector extension
- Docker and Docker Compose (optional)

### Installation

```bash
# Install dependencies
$ pnpm install
```

### Configuration

Configure environment variables in a `.env` file:

```
DATABASE_URL=postgresql://user:password@localhost:5432/aiia
JWT_SECRET=your_jwt_secret
# Add other configuration variables as needed
```

### Running the Application

```bash
# Development
$ pnpm run start:dev

# Production
$ pnpm run start:prod

# Using Docker
$ docker-compose up -d
```

### Deployment

The project includes scripts for deploying to Railway:

```bash
# Setup Railway project
$ ./01-setup-railway.sh

# Set Railway environment variables
$ ./02-set-railway-vars.sh

# Setup GitHub Actions for CI/CD
$ ./03-setup-github-actions.sh

# Complete setup
$ ./04-setup-railway-all.sh
```

## API Documentation

When the application is running, API documentation is available at `/api/docs`.

## License

[MIT](LICENSE)
