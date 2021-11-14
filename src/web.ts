import * as http from 'http';
import express, { Application, Request, Response } from 'express';
import { apiEventsRouteHandler } from './web/ApiEventsRoute';
import { config } from './utils/Configuration';

export class MuzikWeb {
    public readonly expressApplication: Application;
    public readonly httpServer: http.Server;

    constructor() {
        this.expressApplication = express();
        this.expressApplication.disable('x-powered-by');
        this.httpServer = new http.Server(this.expressApplication);
        // Register the routes
        this.expressApplication.get('/api/events', apiEventsRouteHandler);
        if (config.web.hostStatic) {
            // Serve the static files for the site if enabled
            this.expressApplication.use(express.static(config.web.staticDirectory));
        }
        // Send a 404 when the path is not found.
        this.expressApplication.use((req: Request, res: Response) => {
            res.status(404).header('content-type', 'text/plain').send('404: Not Found');
        });
    }

    async start(): Promise<void> {
        this.httpServer.listen(config.web.port, () => {
            console.log('Web server is now listening on ' + config.web.port);
        });
    }
}

(async () => {
    const muzikWeb = new MuzikWeb();
    try {
        await muzikWeb.start();
    } catch (e) {
        console.error(e);
    }
})();
