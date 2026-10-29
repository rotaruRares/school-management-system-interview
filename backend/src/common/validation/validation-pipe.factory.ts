import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { BadRequestError } from '../errors/app-exceptions.js';
import { ErrorCode } from '../errors/error-codes.js';

export interface FieldError {
  field: string;
  constraint: string;
  message: string;
}

export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldError[] {
  const result: FieldError[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      for (const [constraint, message] of Object.entries(error.constraints)) {
        result.push({ field, constraint, message });
      }
    }
    if (error.children && error.children.length > 0) {
      result.push(...flattenValidationErrors(error.children, field));
    }
  }
  return result;
}

class StrictBodyValidationPipe extends ValidationPipe {
  override async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (
      metadata.type === 'body' &&
      value !== undefined &&
      value !== null &&
      (typeof value !== 'object' || Array.isArray(value))
    ) {
      throw new BadRequestError(ErrorCode.VALIDATION_FAILED, 'Request validation failed', {
        errors: [
          {
            field: 'body',
            constraint: 'isObject',
            message: 'The request body must be a JSON object',
          },
        ],
      });
    }
    return super.transform(value, metadata);
  }
}

export function createValidationPipe(): ValidationPipe {
  return new StrictBodyValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestError(ErrorCode.VALIDATION_FAILED, 'Request validation failed', {
        errors: flattenValidationErrors(errors),
      }),
  });
}
