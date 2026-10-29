import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto.js';

const DESCRIPTIONS: Record<number, string> = {
  400: 'Validation failed or malformed request',
  401: 'Missing, invalid or expired credentials',
  403: 'Authenticated but not allowed (wrong role, or not your class/grade)',
  404: 'Resource not found',
  409: 'Conflict (duplicate value or resource in use)',
  422: 'The body refers to an entity that does not exist',
  429: 'Too many attempts',
  503: 'Database unavailable',
};

export function ApiErrors(...statuses: number[]) {
  return applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: DESCRIPTIONS[status] ?? 'Error',
        type: ErrorResponseDto,
      }),
    ),
  );
}
