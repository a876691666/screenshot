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

### 本地开发

1. 克隆仓库:

   ```bash
   git clone <repository-url>
   cd playwright-screenshot-service
   ```

2. 安装依赖:

   ```bash
   npm install
   ```

3. 构建项目:

   ```bash
   npm run build
   ```

4. 启动开发服务器:
   ```bash
   npm run dev
   ```

### Docker 部署

#### 生产环境

1. 使用 Docker Compose 构建和启动服务:

   ```bash
   # 构建并启动 (默认 amd64 架构)
   docker-compose up --build

   # 指定架构构建
   ARCH=arm64 docker-compose up --build
   ```

2. 或者使用多架构构建脚本:
   ```bash
   ./scripts/build-multi-arch.sh
   ```

#### 开发环境

对于开发环境，使用专门的开发配置:

```bash
# 启动开发环境容器
docker-compose -f docker/docker-compose.dev.yml up --build
```

### 架构支持

项目支持以下架构:

- **amd64**: Intel/AMD 64 位架构
- **arm64**: ARM 64 位架构（如 Apple Silicon Mac, ARM 服务器）

### Docker 镜像优化

新的 Dockerfile 使用多阶段构建，具有以下优势:

- **构建分离**: 构建依赖和运行依赖分离，减小最终镜像大小
- **缓存优化**: 分层构建，提高构建效率
- **安全性**: 生产镜像不包含源代码，只有编译后的 JavaScript 文件

## 使用方法

### API 端点

服务启动后，您可以通过以下方式访问截图功能:

```bash
# 健康检查
curl http://localhost:3000/health

# 截取网页截图
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 环境变量

- `NODE_ENV`: 运行环境 (development/production)
- `PORT`: 服务端口 (默认: 3000)
- `DOCKER_ENV`: Docker 环境标识

### 日志

应用使用 Winston 进行日志记录，支持不同级别的日志输出。

### 开发调试

1. 本地开发:

   ```bash
   npm run dev
   ```

2. Docker 开发环境:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml up
   ```

### 生产部署

```bash
# 构建生产镜像
docker-compose up --build -d

# 查看日志
docker-compose logs -f screenshot-service
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

### Other

```

# 安装最小依赖和 Node.js v22
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

```
