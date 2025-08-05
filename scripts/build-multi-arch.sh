#!/bin/bash

# 设置要构建的架构
ARCHS=("amd64" "arm64")

# 定义 Docker 镜像名称
IMAGE_NAME="playwright-screenshot-service"

# 循环构建每个架构的 Docker 镜像
for ARCH in "${ARCHS[@]}"; do
    echo "构建 $ARCH 架构的 Docker 镜像..."

    # 构建 Docker 镜像
    docker build -f docker/Dockerfile.$ARCH -t $IMAGE_NAME:$ARCH .

    if [ $? -ne 0 ]; then
        echo "构建 $ARCH 架构的 Docker 镜像失败"
        exit 1
    fi

    echo "$ARCH 架构的 Docker 镜像构建成功"
done

# 推送镜像到 Docker Hub（可选）
# docker push $IMAGE_NAME:amd64
# docker push $IMAGE_NAME:arm64

echo "所有架构的 Docker 镜像构建完成"