import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle NestJS native HttpExceptions (like from ValidationPipe)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      let message: string = exception.message;
      let error = this.mapStatusCodeToErrorString(statusCode);
      let details: Array<{ field: string; message: string }> | undefined;

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as {
          message?: string | string[];
          error?: string;
          details?: Array<{ field: string; message: string }>;
        };

        if (body.message !== undefined) {
          message = Array.isArray(body.message)
            ? body.message.join(', ')
            : body.message;
        }
        if (body.error && /^[A-Z][A-Z_]+$/.test(body.error)) {
          error = body.error;
        }
        if (body.details) {
          details = body.details;
        }
      }

      return response.status(statusCode).json({
        success: false,
        statusCode,
        error,
        message,
        ...(details && { details }),
        timestamp,
        path,
      });
    }

    this.logger.error(
      `Unhandled exception: ${exception instanceof Error ? exception.message : 'Unknown'}`,
      exception instanceof Error ? exception.stack : '',
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      timestamp,
      path,
    });
  }

  private mapStatusCodeToErrorString(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
