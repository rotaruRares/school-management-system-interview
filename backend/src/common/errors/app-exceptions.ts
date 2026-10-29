import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.js';

export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
    extra: Record<string, unknown> = {},
  ) {
    super({ ...extra, statusCode: status, code, message }, status);
  }
}

export class BadRequestError extends AppException {
  constructor(code: ErrorCode, message: string, extra?: Record<string, unknown>) {
    super(HttpStatus.BAD_REQUEST, code, message, extra);
  }
}

export class UnauthorizedError extends AppException {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.UNAUTHORIZED, code, message);
  }
}

export class ForbiddenError extends AppException {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.FORBIDDEN, code, message);
  }
}

export class NotFoundError extends AppException {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.NOT_FOUND, code, message);
  }
}

export class ConflictError extends AppException {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.CONFLICT, code, message);
  }
}

export class UnprocessableError extends AppException {
  constructor(code: ErrorCode, message: string, extra?: Record<string, unknown>) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, code, message, extra);
  }
}

export class TooManyRequestsError extends AppException {
  constructor(message: string, retryAfterSeconds: number) {
    super(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_ATTEMPTS, message, {
      retryAfter: retryAfterSeconds,
    });
  }
}

export class ServiceUnavailableError extends AppException {
  constructor(code: ErrorCode, message: string) {
    super(HttpStatus.SERVICE_UNAVAILABLE, code, message);
  }
}
