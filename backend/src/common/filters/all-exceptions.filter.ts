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
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof resObj.message === 'string'
            ? resObj.message
            : Array.isArray(resObj.message)
              ? resObj.message.join(', ')
              : exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    } else if (typeof exception === 'string') {
      message = exception;
    }

    const responseBody: Record<string, unknown> = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: String(httpAdapter.getRequestUrl(ctx.getRequest())),
      message:
        httpStatus === (HttpStatus.INTERNAL_SERVER_ERROR as number)
          ? 'Internal server error'
          : message,
    };

    // If it's a HttpException, merge its custom response object into the body
    if (exception instanceof HttpException) {
      const exceptionRes = exception.getResponse();
      if (typeof exceptionRes === 'object' && exceptionRes !== null) {
        Object.assign(responseBody, exceptionRes);
      }
    }

    // Log the error
    const errorLog: Record<string, unknown> = {
      status: httpStatus,
      path: responseBody['path'],
      message: message,
      stack: stack,
      exception: exception,
    };

    this.logger.error(
      `Http Status: ${httpStatus} Error: ${JSON.stringify(
        errorLog,
        (key: string, value: unknown) => {
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
