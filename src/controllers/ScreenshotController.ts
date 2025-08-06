import { Request, Response } from 'express';
import { ScreenshotService } from '../services/ScreenshotService';
import { ScreenshotOptions } from '../types';

export class ScreenshotController {
    private screenshotService: ScreenshotService;

    constructor() {
        this.screenshotService = new ScreenshotService();
    }

    public async captureScreenshot(req: Request, res: Response): Promise<void> {
        const options: ScreenshotOptions = {
            url: req.query.url as string,
            width: req.query.width ? parseInt(req.query.width as string) : undefined,
            height: req.query.height ? parseInt(req.query.height as string) : undefined,
            fullPage: req.query.fullPage === 'true',
            timeout: req.query.timeout ? parseInt(req.query.timeout as string) : undefined,
            waitForThreeJs: req.query.waitForThreeJs === 'true',
            format: req.query.format as 'png' | 'jpeg' || 'png',
            quality: req.query.quality ? parseInt(req.query.quality as string) : undefined,
        };

        try {
            const screenshot = await this.screenshotService.captureScreenshot(options);
            res.set('Content-Type', 'image/png');
            res.send(screenshot);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            res.status(500).json({ error: errorMessage });
        }
    }
}