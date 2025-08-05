# Playwright Screenshot Service

## Overview

The Playwright Screenshot Service is a Node.js application that utilizes Playwright to capture screenshots of web pages. This service is designed to be run in a Docker environment and supports both amd64 and arm64 architectures.

## Features

- **Playwright Integration**: Leverages Playwright for browser automation and screenshot capabilities.
- **Multi-Architecture Support**: Dockerfiles are provided for both amd64 and arm64 architectures.
- **Logging**: Built-in logging utility for tracking operations and errors.
- **TypeScript**: Written in TypeScript for better type safety and maintainability.

## Project Structure

```
playwright-screenshot-service
├── src
│   ├── app.ts                  # Entry point of the application
│   ├── services
│   │   └── ScreenshotService.ts # Service for managing Playwright and screenshots
│   ├── controllers
│   │   └── ScreenshotController.ts # Controller for handling screenshot requests
│   ├── types
│   │   └── index.ts            # Type definitions and interfaces
│   └── utils
│       └── logger.ts           # Logging utility
├── docker
│   ├── Dockerfile.amd64        # Dockerfile for amd64 architecture
│   ├── Dockerfile.arm64        # Dockerfile for arm64 architecture
│   └── docker-compose.yml      # Docker Compose configuration
├── scripts
│   ├── build-multi-arch.sh     # Script for building multi-architecture Docker images
│   └── setup.sh                # Script for setting up the project environment
├── package.json                 # npm configuration file
├── tsconfig.json               # TypeScript configuration file
├── .dockerignore                # Files and directories to ignore in Docker builds
├── .gitignore                   # Files and directories to ignore in Git
└── README.md                    # Project documentation and usage instructions
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd playwright-screenshot-service
   ```

2. Run the setup script to install dependencies:
   ```
   ./scripts/setup.sh
   ```

## Usage

To start the service, you can use Docker Compose:

```
docker-compose up
```

This will build the necessary Docker images and start the application.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.