import { Request, Response } from 'express';
import { ScreenshotService } from '../services/ScreenshotService';
import { ScreenshotOptions } from '../types';

export class ScreenshotController {
    private screenshotService: ScreenshotService;

    constructor() {
        this.screenshotService = new ScreenshotService();
    }

    public async captureScreenshot(req: Request, res: Response): Promise<void> {
        const options: ScreenshotOptions = req.body;

        try {
            const screenshot = await this.screenshotService.captureScreenshot(options);
            res.set('Content-Type', 'image/png');
            res.send(screenshot);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}