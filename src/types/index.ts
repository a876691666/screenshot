export interface ScreenshotOptions {
    url: string;
    width?: number;
    height?: number;
    fullPage?: boolean;
    timeout?: number;
    waitForThreeJs?: boolean;
    format?: 'png' | 'jpeg';
    quality?: number;
}