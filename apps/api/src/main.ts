import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { DatabaseService } from './common/database/database.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as crypto from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers & Cookies
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
  });

  // Request ID middleware
  app.use((req: any, res: any, next: any) => {
    req.id = req.headers['x-request-id'] || `REQ-${crypto.randomBytes(6).toString('hex')}`;
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  // Global Exception Sanitizer (Zero PHI / Stack traces to clients)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Audit Interceptor
  const db = app.get(DatabaseService);
  app.useGlobalInterceptors(new AuditLogInterceptor(db));

  // OpenAPI Swagger Specification Generation
  const config = new DocumentBuilder()
    .setTitle('ELDERCARE 360 Core API')
    .setDescription('Safety-critical care continuity API with consent-as-code and tamper-evident ledger')
    .setVersion('1.0.0')
    .addCookieAuth('eldercare_session')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[ELDERCARE 360] API Server running on port ${port}. OpenAPI docs at /api/docs`);
}

bootstrap();
