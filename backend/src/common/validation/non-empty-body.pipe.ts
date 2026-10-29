import { Injectable, PipeTransform } from '@nestjs/common';
import { BadRequestError } from '../errors/app-exceptions.js';
import { ErrorCode } from '../errors/error-codes.js';

@Injectable()
export class NonEmptyBodyPipe implements PipeTransform<object, object> {
  transform(value: object): object {
    const provided = Object.values(value).filter((field) => field !== undefined);
    if (provided.length === 0) {
      throw new BadRequestError(ErrorCode.EMPTY_UPDATE, 'Provide at least one field to update');
    }
    return value;
  }
}
