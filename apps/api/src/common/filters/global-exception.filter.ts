import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * 글로벌 예외 필터
 * 모든 예외를 일관된 형식으로 처리하고 로깅합니다.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const exceptionObj = exceptionResponse as any;
        message = exceptionObj.message || exceptionObj.error || exception.message;
        error = exceptionObj.error || exception.constructor.name;
      } else {
        message = exceptionResponse as string;
        error = exception.constructor.name;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';

      // Log unexpected errors
      this.logger.error(
        `❌ Unhandled Exception:\n` +
          `  Method: ${request.method}\n` +
          `  URL: ${request.url}\n` +
          `  Status: ${status}\n` +
          `  Error: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined
      );
    }

    // Log error details
    if (status >= 500) {
      this.logger.error(
        `❌ Server Error:\n` +
          `  Method: ${request.method}\n` +
          `  URL: ${request.url}\n` +
          `  Status: ${status}\n` +
          `  Message: ${message}`,
        exception instanceof Error ? exception.stack : undefined
      );
    } else if (status >= 400) {
      this.logger.warn(
        `⚠️ Client Error:\n` +
          `  Method: ${request.method}\n` +
          `  URL: ${request.url}\n` +
          `  Status: ${status}\n` +
          `  Message: ${message}`
      );
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Don't include stack trace in production
    if (process.env.NODE_ENV === 'development') {
      if (exception instanceof Error) {
        (errorResponse as any).stack = exception.stack;
      }
    }

    response.code(status).send(errorResponse);
  }
}