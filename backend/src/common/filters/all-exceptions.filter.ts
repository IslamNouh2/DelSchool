import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: (exception as any).message || 'Internal server error',
    };

    // Log the error
    this.logger.error(
      `Http Status: ${httpStatus} Error: ${JSON.stringify(exception)}`,
    );

    // Don't leak stack trace in production
    if (process.env.NODE_ENV === 'production' && httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      responseBody.message = 'An unexpected error occurred. Please try again later.';
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
