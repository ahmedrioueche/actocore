import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, type Request, type Response, type NextFunction } from 'express';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { isCorsOriginAllowed } from '../../config/cors-origin.util';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const apiVersion = config.getOrThrow<string>('apiVersion');
  const http = config.getOrThrow<{
    bodyLimitSdk: string;
    bodyLimitWeb: string;
    corsAllowedOrigins: string[];
    corsOriginPatterns: string[];
  }>('http');

  const sdkPrefix = `/${apiVersion}/sdk`;
  const webPrefix = `/${apiVersion}/web`;
  const marketingPrefix = `/${apiVersion}/marketing`;

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowed = isCorsOriginAllowed(
        origin,
        http.corsAllowedOrigins,
        http.corsOriginPatterns,
      );
      callback(null, allowed);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-Playground-Token',
    ],
  });

  const paypalWebhookPath = `${webPrefix}/billing/paypal/webhook`;
  app.use(
    paypalWebhookPath,
    json({
      limit: http.bodyLimitWeb,
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(sdkPrefix, json({ limit: http.bodyLimitSdk }));
  app.use(webPrefix, json({ limit: http.bodyLimitWeb }));
  app.use(
    marketingPrefix,
    json({
      limit: http.bodyLimitSdk,
      type: (req: Request) => {
        const contentType = req.headers['content-type'] ?? '';
        return (
          contentType.includes('application/json') ||
          contentType.includes('application/*+json')
        );
      },
    }),
  );
  app.use(
    json({
      limit: http.bodyLimitSdk,
      type: (req: Request) => {
        const contentType = req.headers['content-type'] ?? '';
        return (
          contentType.includes('application/json') ||
          contentType.includes('application/*+json')
        );
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    if (path.startsWith(sdkPrefix)) {
      res.setHeader('X-Actocore-Entry', 'sdk');
    } else if (path.startsWith(webPrefix)) {
      res.setHeader('X-Actocore-Entry', 'web');
    } else if (path.startsWith(marketingPrefix)) {
      res.setHeader('X-Actocore-Entry', 'marketing');
    }
    next();
  });

  app.setGlobalPrefix(apiVersion, {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/(.*)', method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
