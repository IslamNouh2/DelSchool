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

    let message = 'An error occurred';
    let stack = undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      message =
        typeof response === 'object' &&
        response !== null &&
        'message' in response
          ? (response as any).message
          : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    } else if (typeof exception === 'string') {
      message = exception;
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: String(httpAdapter.getRequestUrl(ctx.getRequest())),
      message:
        httpStatus === (HttpStatus.INTERNAL_SERVER_ERROR as number)
          ? 'Internal server error'
          : message,
    };

    // Log the error
    const errorLog = {
      status: httpStatus,
      path: responseBody.path,
      message: message,
      stack: stack,
      exception: exception,
    };

    this.logger.error(
      `Http Status: ${httpStatus} Error: ${JSON.stringify(
        errorLog,
        (key, value) => {
          if (key === 'stack' && typeof value === 'string') {
            return value.split('\n');
          }
          return value;
        },
      )}`,
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
