import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, type Request, type Response, type NextFunction } from 'express';
import { HttpExceptionFilter } from '../filters/http-exception.filter';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const apiVersion = config.getOrThrow<string>('apiVersion');
  const http = config.getOrThrow<{
    bodyLimitSdk: string;
    bodyLimitWeb: string;
    corsSdkOrigins: string[];
    corsWebOrigins: string[];
  }>('http');

  const sdkPrefix = `/${apiVersion}/sdk`;
  const webPrefix = `/${apiVersion}/web`;

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

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
  app.use(json({ limit: http.bodyLimitSdk }));

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowed = new Set([
        ...http.corsSdkOrigins,
        ...http.corsWebOrigins,
      ]);
      callback(null, allowed.has(origin));
    },
    credentials: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    if (path.startsWith(sdkPrefix)) {
      res.setHeader('X-Actocore-Entry', 'sdk');
    } else if (path.startsWith(webPrefix)) {
      res.setHeader('X-Actocore-Entry', 'web');
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
