import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const correlationRef = `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An internal system error occurred.';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        errorCode = (res as any).error || errorCode;
      }
    } else {
      // Redact stack traces and internal DB messages from client response
      this.logger.error(`[${correlationRef}] Unhandled exception: ${(exception as any)?.message}`);
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message,
      correlationRef,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
