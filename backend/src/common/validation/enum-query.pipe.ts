import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { BadRequestError } from '../errors/app-exceptions.js';
import { ErrorCode } from '../errors/error-codes.js';

@Injectable()
export class EnumQueryPipe<T extends string> implements PipeTransform<unknown, T | undefined> {
  constructor(private readonly allowed: readonly T[]) {}

  transform(value: unknown, metadata: ArgumentMetadata): T | undefined {
    if (value === undefined) {
      return undefined;
    }
    const name = metadata.data ?? 'parameter';
    if (typeof value !== 'string' || !(this.allowed as readonly string[]).includes(value)) {
      throw new BadRequestError(
        ErrorCode.INVALID_PARAMETER,
        `${name} must be one of: ${this.allowed.join(', ')}`,
        { parameter: name },
      );
    }
    return value as T;
  }
}
