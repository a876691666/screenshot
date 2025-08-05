#!/bin/bash

# 设置项目环境
echo "正在设置项目环境..."

# 安装依赖
echo "安装依赖..."
npm install

# 安装 Playwright 浏览器
echo "安装 Playwright 浏览器..."
npx playwright install

echo "项目环境设置完成。"