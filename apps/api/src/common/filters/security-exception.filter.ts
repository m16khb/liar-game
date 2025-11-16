import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface SecurityErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss');
  path: string;
  details?: any;
  requestId?: string;
}

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let details = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || 'Unknown error';
        details = responseObj.details || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // 개발 환경이 아닌 경우 구체적인 에러 메시지 숨김
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
      }
    }

    // 에러 로깅
    this.logError(request, status, message, exception);

    // 보안 관련 에러인 경우 추가 로깅
    if (this.isSecurityRelatedError(status, message)) {
      this.logSecurityEvent(request, message);
    }

    const errorResponse: SecurityErrorResponse = {
      statusCode: status,
      message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
      details,
      requestId: (request as any).id || this.generateRequestId(),
    };

    response.status(status).json(errorResponse);
  }

  private logError(
    request: Request,
    status: number,
    message: string,
    exception: unknown,
  ): void {
    const logData = {
      method: request.method,
      url: request.url,
      status,
      message,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: (request as any).user?.id || 'anonymous',
    };

    if (status >= 500) {
      this.logger.error(`Server Error: ${JSON.stringify(logData)}`, exception as Error);
    } else if (status >= 400) {
      this.logger.warn(`Client Error: ${JSON.stringify(logData)}`);
    }
  }

  private logSecurityEvent(request: Request, message: string): void {
    const securityLog = {
      event: 'SECURITY_VIOLATION',
      message,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id || 'anonymous',
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`Security Event: ${JSON.stringify(securityLog)}`);

    // TODO: 추후 외부 로깅 시스템 (ELK, Datadog 등) 연동
  }

  private isSecurityRelatedError(status: number, message: string): boolean {
    const securityKeywords = [
      'unauthorized',
      'forbidden',
      'rate limit',
      'xss',
      'injection',
      'csrf',
      'authentication',
      'authorization',
    ];

    return (
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN ||
      status === HttpStatus.TOO_MANY_REQUESTS ||
      securityKeywords.some(keyword => message.toLowerCase().includes(keyword))
    );
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Error';
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
