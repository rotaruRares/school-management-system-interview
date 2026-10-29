import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ErrorCode } from './error-codes.js';

interface ErrorPayload {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHENTICATED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  413: ErrorCode.PAYLOAD_TOO_LARGE,
  429: ErrorCode.TOO_MANY_ATTEMPTS,
  503: ErrorCode.DATABASE_UNAVAILABLE,
};

function payload(
  status: number,
  code: ErrorCode,
  message: string,
  extra: Record<string, unknown> = {},
): ErrorPayload {
  return { status, body: { statusCode: status, code, message, ...extra } };
}

function fromHttpException(exception: HttpException): ErrorPayload {
  const status = exception.getStatus();
  const response = exception.getResponse();

  if (typeof response === 'object' && response !== null) {
    const body = response as Record<string, unknown>;
    if (typeof body.code === 'string') {
      const { retryAfter, ...rest } = body;
      const result: ErrorPayload = { status, body: { ...rest, statusCode: status } };
      if (typeof retryAfter === 'number') {
        result.headers = { 'Retry-After': String(retryAfter) };
        result.body.retryAfter = retryAfter;
      }
      return result;
    }
    const rawMessage = body.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : exception.message;
    return payload(status, CODE_BY_STATUS[status] ?? ErrorCode.BAD_REQUEST, message);
  }

  return payload(status, CODE_BY_STATUS[status] ?? ErrorCode.BAD_REQUEST, String(response));
}

function fromPrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorPayload {
  switch (error.code) {
    case 'P2002':
      return payload(HttpStatus.CONFLICT, ErrorCode.DUPLICATE_VALUE, 'A record with this value already exists');
    case 'P2025':
      return payload(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, 'Record not found');
    case 'P2003':
    case 'P2014':
      return payload(HttpStatus.CONFLICT, ErrorCode.IN_USE, 'The record is referenced by other data');
    default:
      return payload(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, 'Internal server error');
  }
}

function fromHttpLikeError(exception: unknown): ErrorPayload | undefined {
  const candidate = exception as { status?: unknown; statusCode?: unknown; expose?: unknown };
  const status = typeof candidate.statusCode === 'number' ? candidate.statusCode : candidate.status;
  if (typeof status === 'number' && status >= 400 && status < 500 && candidate.expose === true) {
    return payload(
      status,
      CODE_BY_STATUS[status] ?? ErrorCode.BAD_REQUEST,
      status === 413 ? 'Request body too large' : 'Malformed request',
    );
  }
  return undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const result = this.toPayload(exception);

    if (result.status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${result.status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (result.headers) {
      for (const [name, value] of Object.entries(result.headers)) {
        response.setHeader(name, value);
      }
    }
    response.status(result.status).json(result.body);
  }

  private toPayload(exception: unknown): ErrorPayload {
    if (exception instanceof HttpException) {
      return fromHttpException(exception);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return fromPrismaError(exception);
    }
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return payload(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.DATABASE_UNAVAILABLE,
        'The database is unavailable',
      );
    }
    const httpLike = fromHttpLikeError(exception);
    if (httpLike) {
      return httpLike;
    }
    return payload(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      'Internal server error',
    );
  }
}
