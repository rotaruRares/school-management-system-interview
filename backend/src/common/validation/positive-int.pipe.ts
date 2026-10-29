import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { BadRequestError } from '../errors/app-exceptions.js';
import { ErrorCode } from '../errors/error-codes.js';
import { MAX_ID } from './decorators.js';

@Injectable()
export class PositiveIntPipe implements PipeTransform<string | undefined, number | undefined> {
  constructor(private readonly options: { optional?: boolean } = {}) {}

  transform(value: string | undefined, metadata: ArgumentMetadata): number | undefined {
    if (value === undefined && this.options.optional) {
      return undefined;
    }
    const name = metadata.data ?? 'parameter';
    if (typeof value !== 'string' || !/^[1-9]\d{0,9}$/.test(value) || Number(value) > MAX_ID) {
      throw new BadRequestError(
        ErrorCode.INVALID_PARAMETER,
        `${name} must be a positive integer`,
        { parameter: name },
      );
    }
    return Number(value);
  }
}
