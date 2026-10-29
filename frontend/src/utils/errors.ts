import axios from 'axios';
import type { ApiErrorBody } from '../types';

const MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: 'Some fields are not valid.',
  INVALID_PARAMETER: 'The request contains an invalid value.',
  EMPTY_UPDATE: 'Change at least one field before saving.',
  UNAUTHENTICATED: 'Your session has expired. Please sign in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  REFRESH_TOKEN_INVALID: 'Your session has expired. Please sign in again.',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please wait a few minutes and try again.',
  FORBIDDEN: 'You are not allowed to do this.',
  INSUFFICIENT_ROLE: 'Your role is not allowed to do this.',
  NOT_CLASS_TEACHER: 'You are not the teacher of this class.',
  NOT_GRADE_AUTHOR: 'You can only change grades that you gave.',
  PROFILE_NOT_FOUND: 'No profile is linked to this account.',
  NOT_FOUND: 'The record was not found.',
  STUDENT_NOT_FOUND: 'The student was not found.',
  TEACHER_NOT_FOUND: 'The teacher was not found.',
  CLASS_NOT_FOUND: 'The class was not found.',
  GRADE_NOT_FOUND: 'The grade was not found.',
  CONFLICT: 'This conflicts with existing data.',
  EMAIL_TAKEN: 'This email address is already in use.',
  CLASS_NAME_TAKEN: 'A class with this name already exists.',
  DUPLICATE_VALUE: 'A record with this value already exists.',
  IN_USE: 'This record is still used by other data.',
  PAYLOAD_TOO_LARGE: 'The request is too large.',
  DATABASE_UNAVAILABLE: 'The database is unavailable. Try again shortly.',
  INTERNAL_ERROR: 'The server had a problem. Try again shortly.',
};

export function apiErrorBody(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const data: unknown = error.response?.data;
  if (typeof data === 'object' && data !== null && 'code' in data) {
    return data as ApiErrorBody;
  }
  return null;
}

export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'Cannot reach the server. Is the backend running?';
  }
  const body = apiErrorBody(error);
  if (!body) {
    return fallback;
  }
  if (body.code === 'VALIDATION_FAILED' && body.errors && body.errors.length > 0) {
    return body.errors.map((item) => item.message).join(' ');
  }
  return MESSAGES[body.code] ?? fallback;
}
