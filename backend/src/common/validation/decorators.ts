import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsByteLength,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { addDaysUtc, addYearsUtc, parseDateOnly, todayUtc } from './date.util.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M} '’.-]*$/u;
const CLASS_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .\-/]*$/u;
const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\d).+$/u;

export const MAX_ID = 2147483647;

export function OptionalNotNull() {
  return ValidateIf((_object: unknown, value: unknown) => value !== undefined);
}

export function PersonName() {
  return applyDecorators(
    Transform(trim),
    IsString(),
    MinLength(1),
    MaxLength(50),
    Matches(PERSON_NAME_PATTERN, {
      message: '$property may only contain letters, spaces, apostrophes, dots and hyphens',
    }),
  );
}

export function ClassName() {
  return applyDecorators(
    Transform(trim),
    IsString(),
    MinLength(1),
    MaxLength(50),
    Matches(CLASS_NAME_PATTERN, {
      message: '$property may only contain letters, digits, spaces, dots, hyphens and slashes',
    }),
  );
}

export function EmailField() {
  return applyDecorators(Transform(normalizeEmail), IsString(), IsEmail(), MaxLength(254));
}

export function PasswordField() {
  return applyDecorators(
    IsString(),
    IsByteLength(8, 72, {
      message: '$property must be between 8 and 72 bytes long',
    }),
    Matches(PASSWORD_PATTERN, {
      message: '$property must contain at least one letter and one digit',
    }),
  );
}

export function IdField() {
  return applyDecorators(IsInt(), Min(1));
}

export function NullableIdField() {
  return applyDecorators(
    ValidateIf((_object: unknown, value: unknown) => value !== undefined && value !== null),
    IsInt(),
    Min(1),
  );
}

export function RequiredNullableIdField() {
  return applyDecorators(
    ValidateIf((_object: unknown, value: unknown) => value !== null),
    IsInt(),
    Min(1),
  );
}

export interface DateOnlyOptions {
  notInFuture?: boolean;
  minAgeYears?: number;
  maxAgeYears?: number;
}

export function IsDateOnly(options: DateOnlyOptions = {}, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isDateOnly',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          const date = parseDateOnly(value);
          if (!date) {
            return false;
          }
          const today = todayUtc();
          if (options.notInFuture && date.getTime() > addDaysUtc(today, 1).getTime()) {
            return false;
          }
          if (
            options.maxAgeYears !== undefined &&
            date.getTime() < addYearsUtc(today, -options.maxAgeYears).getTime()
          ) {
            return false;
          }
          if (
            options.minAgeYears !== undefined &&
            date.getTime() > addYearsUtc(today, -options.minAgeYears).getTime()
          ) {
            return false;
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          if (options.minAgeYears !== undefined || options.maxAgeYears !== undefined) {
            return `${args.property} must be a valid YYYY-MM-DD date within the allowed age range`;
          }
          if (options.notInFuture) {
            return `${args.property} must be a valid YYYY-MM-DD date that is not in the future`;
          }
          return `${args.property} must be a valid YYYY-MM-DD date`;
        },
      },
    });
  };
}
