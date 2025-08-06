import { Browser, Page, chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { ScreenshotOptions } from '../types';

// Declare the global property for TypeScript
declare global {
    interface Window {
        __threeJsReady?: boolean;
    }
}

export class ScreenshotService {
    private browser: Browser | null = null;
    private isPlaywrightReady = false;
    private isShuttingDown = false;

    constructor() {
        // 异步初始化 Playwright
        this.initializePlaywright();
    }

    private async initializePlaywright(): Promise<void> {
        try {
            console.log('开始初始化 Playwright...');

            const playwrightPath = this.getPlaywrightPath();
            console.log(`Playwright 路径: ${playwrightPath}`);

            if (process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV) {
                await this.ensureBrowsersInstalled();
            }

            this.isPlaywrightReady = true;
            console.log('Playwright 初始化完成');
        } catch (error) {
            console.error('Playwright 初始化失败:', error);
            this.isPlaywrightReady = false;
        }
    }

    private getPlaywrightPath(): string {
        try {
            const possiblePaths = [
                path.join(process.cwd(), 'node_modules', 'playwright'),
                path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright'),
                path.join(__dirname, 'node_modules', 'playwright'),
                '/usr/lib/node_modules/playwright',
                process.env.PLAYWRIGHT_BROWSERS_PATH || ''
            ];

            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    return possiblePath;
                }
            }

            return 'playwright';
        } catch (error) {
            console.warn('无法确定 Playwright 路径:', error);
            return 'playwright';
        }
    }

    private async ensureBrowsersInstalled(): Promise<void> {
        try {
            console.log('检查浏览器安装状态...');
            const testBrowser = await chromium.launch({
                headless: true,
                timeout: 10000
            });
            await testBrowser.close();
            console.log('浏览器验证成功');
        } catch (error) {
            console.error('浏览器验证失败，可能需要安装:', error);
            throw new Error('Playwright 浏览器未正确安装，请运行 npx playwright install chromium');
        }
    }

    async getBrowser(): Promise<Browser> {
        if (!this.isPlaywrightReady) {
            throw new Error('Playwright 尚未初始化完成');
        }

        if (!this.browser || !this.browser.isConnected()) {
            console.log('启动新的浏览器实例');

            const launchOptions = {
                headless: true,
                args: this.getBrowserArgs(),
                ...(process.env.DOCKER_ENV && {
                    executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser'
                })
            };

            try {
                this.browser = await chromium.launch(launchOptions);
            } catch (error) {
                console.error('浏览器启动失败:', error);
                if (!process.env.DOCKER_ENV) {
                    try {
                        console.log('尝试使用系统 Chrome...');
                        this.browser = await chromium.launch({
                            ...launchOptions,
                            channel: 'chrome'
                        });
                    } catch (fallbackError) {
                        console.error('系统 Chrome 启动也失败:', fallbackError);
                        throw new Error('无法启动任何浏览器实例');
                    }
                } else {
                    throw error;
                }
            }
        }
        return this.browser;
    }

    private getBrowserArgs(): string[] {
        const baseArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list'
        ];

        if (process.env.DOCKER_ENV) {
            baseArgs.push(
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-software-rasterizer',
                '--single-process'
            );
        }

        return baseArgs;
    }

    async captureScreenshot(options: ScreenshotOptions): Promise<Buffer> {
        if (this.isShuttingDown) {
            throw new Error('服务正在关闭中，无法处理新的截图请求');
        }

        const {
            url,
            width = 1920,
            height = 1080,
            fullPage = true,
            timeout = 600000,
            waitForThreeJs = true,
            format = 'png',
            quality = 90
        } = options;

        console.log(`开始截图: ${url}`);

        try {
            const browser = await this.getBrowser();
            const page = await browser.newPage();
            try {
                await page.setViewportSize({ width, height });
                await page.setExtraHTTPHeaders({
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                });

                page.setDefaultTimeout(timeout);
                page.setDefaultNavigationTimeout(timeout);

                let requestCount = 0;
                let responseCount = 0;

                page.on('request', (request) => {
                    requestCount++;
                    console.debug(`发起请求 #${requestCount}: ${request.url()}`);
                });

                page.on('response', (response) => {
                    responseCount++;
                    console.debug(`收到响应 #${responseCount}: ${response.url()} - ${response.status()}`);
                });

                page.on('pageerror', (error) => {
                    console.warn(`页面错误: ${error.message}`);
                });

                page.on('console', (msg) => {
                    if (msg.type() === 'error') {
                        console.warn(`浏览器控制台错误: ${msg.text()}`);
                    }
                });

                console.log(`正在加载页面: ${url}...`);

                try {
                    await page.goto(url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 60000
                    });
                    console.log('页面基本加载完成，等待网络空闲...');
                    await page.waitForLoadState('networkidle', { timeout: 120000 });
                    console.log('页面网络空闲完成');
                } catch (error: any) {
                    console.warn(`页面加载出现问题: ${error.message}`);
                    try {
                        await page.waitForLoadState('load', { timeout: 30000 });
                        console.log('页面基本加载完成（降级模式）');
                    } catch (fallbackError: any) {
                        console.error(`页面加载完全失败: ${fallbackError.message}`);
                        throw new Error(`无法加载页面 ${url}: ${fallbackError.message}`);
                    }
                }

                console.log('等待 iframe 加载完成...');
                await this.waitForAllIframes(page);

                if (waitForThreeJs) {
                    console.log('等待 Three.js 和 GLB 模型渲染完成...');
                    await this.waitForThreeJsReady(page);
                }

                await page.waitForTimeout(2000);
                console.log('开始截图...');
                const screenshotOptions: any = {
                    fullPage,
                    type: format
                };

                if (format === 'jpeg') {
                    screenshotOptions.quality = quality;
                }

                const screenshot = await page.screenshot(screenshotOptions);
                console.log(`截图完成，大小: ${screenshot.length} bytes`);
                return screenshot;

            } catch (error: any) {
                console.error(`截图失败: ${error.message}`, error.stack);
                throw error;
            } finally {
                await page.close();
            }
        } catch (error: any) {
            console.error(`处理截图请求时出错: ${error.message}`, error.stack);
            throw new Error(`无法处理截图请求: ${error.message}`);
        }
    }

    private async waitForAllIframes(page: Page): Promise<void> {
        const waitForNestedFrames = async (frame: any): Promise<void> => {
            const childFrames = frame.childFrames();
            if (childFrames.length > 0) {
                await Promise.all(
                    childFrames.map(async (child: any) => {
                        try {
                            await child.waitForLoadState('domcontentloaded', { timeout: 10000 });
                            await waitForNestedFrames(child);
                        } catch (error: any) {
                            console.warn(`iframe 加载超时: ${error.message}`);
                        }
                    })
                );
            }
        };

        try {
            await waitForNestedFrames(page.mainFrame());
            await page.waitForLoadState('networkidle', { timeout: 15000 });
        } catch (error: any) {
            console.warn(`等待 iframe 完成时出现警告: ${error.message}`);
        }
    }

    private async waitForThreeJsReady(page: Page): Promise<void> {
        try {
            await page.addScriptTag({
                content: `
                (function() {
                    const checkThreeJsAndModelsReady = () => {
                        const canvases = Array.from(document.querySelectorAll('canvas'));
                        const hasWebGLCanvas = canvases.some(canvas => {
                            const context = canvas.getContext('webgl') || 
                                            canvas.getContext('webgl2') || 
                                            canvas.getContext('experimental-webgl');
                            return context !== null;
                        });
                        
                        const hasThreeJS = typeof window.THREE !== 'undefined';
                        
                        const isLoadingResources = () => {
                            const performanceEntries = performance.getEntriesByType('resource');
                            const recentRequests = performanceEntries.filter(entry => {
                                const now = performance.now();
                                return (now - entry.startTime) < 30000 && 
                                       (entry.name.includes('.glb') || 
                                        entry.name.includes('.gltf') || 
                                        entry.name.includes('.bin') ||
                                        entry.name.includes('texture') ||
                                        entry.name.includes('model'));
                            });
                            
                            const hasIncompleteRequests = recentRequests.some(entry => 
                                entry.responseEnd === 0 || entry.duration === 0
                            );
                            
                            return hasIncompleteRequests;
                        };
                        
                        const checkGLBLoadingStatus = () => {
                            try {
                                if (window.THREE && window.THREE.GLTFLoader) {
                                    const loadingIndicators = document.querySelectorAll([
                                        '[data-loading="true"]',
                                        '.loading',
                                        '.loader',
                                        '.progress',
                                        '.spinner'
                                    ].join(','));
                                    
                                    if (loadingIndicators.length > 0) {
                                        const visibleLoaders = Array.from(loadingIndicators).some(el => {
                                            const style = window.getComputedStyle(el);
                                            return style.display !== 'none' && style.visibility !== 'hidden';
                                        });
                                        return visibleLoaders;
                                    }
                                }
                                
                                const globalLoadingVars = [
                                    'isLoading',
                                    'modelLoading', 
                                    'assetsLoading',
                                    'sceneLoading'
                                ];
                                
                                for (const varName of globalLoadingVars) {
                                    if (window[varName] === true) {
                                        return true;
                                    }
                                }
                                
                                return false;
                            } catch (error) {
                                console.warn('检查GLB加载状态时出错:', error);
                                return false;
                            }
                        };
                        
                        const checkSceneObjects = () => {
                            try {
                                const canvas = document.querySelector('canvas');
                                if (canvas) {
                                    const ctx = canvas.getContext('2d') || 
                                                canvas.getContext('webgl') || 
                                                canvas.getContext('webgl2');
                                    
                                    if (ctx) {
                                        const imageData = canvas.toDataURL();
                                        const isBlank = imageData === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                                        return !isBlank;
                                    }
                                }
                                return true;
                            } catch (error) {
                                console.warn('检查场景对象时出错:', error);
                                return true;
                            }
                        };
                        
                        return hasWebGLCanvas && 
                               !isLoadingResources() && 
                               !checkGLBLoadingStatus() && 
                               checkSceneObjects();
                    };
                    
                    const stopAnimations = () => {
                        if (typeof requestAnimationFrame === 'function') {
                            const hooks = window.__rAFHooks = window.__rAFHooks || [];
                            const originalRAF = window.requestAnimationFrame;
                            
                            window.requestAnimationFrame = (callback) => {
                                const id = originalRAF((timestamp) => {
                                    const index = hooks.indexOf(id);
                                    if (index > -1) {
                                        hooks.splice(index, 1);
                                    }
                                    callback(timestamp);
                                });
                                hooks.push(id);
                                return id;
                            };
                            
                            hooks.forEach(id => {
                                try {
                                    cancelAnimationFrame(id);
                                } catch (e) {
                                    console.warn('取消动画帧失败:', e);
                                }
                            });
                            hooks.length = 0;
                        }
                    };
                    
                    return new Promise((resolve) => {
                        let attempts = 0;
                        const maxAttempts = 200;
                        
                        console.log('开始检测 Three.js 和 GLB 模型加载状态...');
                        
                        const checkInterval = setInterval(() => {
                            attempts++;
                            
                            if (checkThreeJsAndModelsReady()) {
                                console.log(\`Three.js 和模型加载完成，用时: \${attempts * 50}ms\`);
                                clearInterval(checkInterval);
                                stopAnimations();
                                
                                setTimeout(() => {
                                    window.__threeJsReady = true;
                                    resolve(true);
                                }, 500);
                            } else if (attempts >= maxAttempts) {
                                console.log('等待超时，强制继续截图');
                                clearInterval(checkInterval);
                                window.__threeJsReady = true;
                                resolve(false);
                            }
                            
                            if (attempts % 40 === 0) {
                                console.log(\`检测中... (\${attempts * 50}ms)\`);
                            }
                        }, 50);
                    });
                })();
                `
            });

            await page.waitForFunction(() => window.__threeJsReady === true, {
                timeout: 600000
            });

            console.log('Three.js 和 GLB 模型检测完成');

        } catch (error: any) {
            console.warn(`Three.js 和模型等待超时，继续截图: ${error.message}`);
        }
    }
}