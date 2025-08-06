import express from 'express';
import bodyParser from 'body-parser';
import { ScreenshotController } from './controllers/ScreenshotController';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Screenshot Controller
const screenshotController = new ScreenshotController();

// Routes
app.get('/screenshot', (req, res) => screenshotController.captureScreenshot(req, res));

// Start the server
app.listen(port, () => {
    console.log('debug', `应用程序正在运行在 http://localhost:${port}`);
});