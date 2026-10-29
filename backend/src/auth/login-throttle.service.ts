import { Injectable } from '@nestjs/common';
import { getConfig } from '../config/app-config.js';
import { TooManyRequestsError } from '../common/errors/app-exceptions.js';

interface Attempt {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 10_000;

@Injectable()
export class LoginThrottleService {
  private readonly attempts = new Map<string, Attempt>();
  private readonly settings = getConfig().loginThrottle;

  assertAllowed(key: string): void {
    const entry = this.attempts.get(key);
    if (!entry) {
      return;
    }
    const now = Date.now();
    if (entry.resetAt <= now) {
      this.attempts.delete(key);
      return;
    }
    if (entry.count >= this.settings.maxAttempts) {
      throw new TooManyRequestsError(
        'Too many failed login attempts. Try again later.',
        Math.ceil((entry.resetAt - now) / 1000),
      );
    }
  }

  recordFailure(key: string): void {
    const now = Date.now();
    this.prune(now);
    const entry = this.attempts.get(key);
    if (!entry || entry.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + this.settings.windowSeconds * 1000 });
      return;
    }
    entry.count += 1;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  private prune(now: number): void {
    if (this.attempts.size < MAX_TRACKED_KEYS) {
      return;
    }
    for (const [key, entry] of this.attempts) {
      if (entry.resetAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}
