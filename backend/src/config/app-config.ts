export interface AppConfig {
  port: number;
  isProduction: boolean;
  corsOrigins: string[];
  trustProxy: boolean;
  bcryptRounds: number;
  jwt: {
    secret: string;
    issuer: string;
    audience: string;
    accessTtlSeconds: number;
  };
  refreshToken: {
    ttlSeconds: number;
    cookieName: string;
    cookiePath: string;
    secureCookie: boolean;
  };
  loginThrottle: {
    maxAttempts: number;
    windowSeconds: number;
  };
}

let cached: AppConfig | undefined;

function readInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} must be "true" or "false"`);
}

export function getConfig(): AppConfig {
  if (cached) {
    return cached;
  }

  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set and at least 32 characters long. Generate one with: openssl rand -hex 32',
    );
  }

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  cached = {
    port: readInt('PORT', 3000, 1, 65535),
    isProduction: process.env.NODE_ENV === 'production',
    corsOrigins,
    trustProxy: readBool('TRUST_PROXY', false),
    bcryptRounds: readInt('BCRYPT_ROUNDS', 12, 10, 15),
    jwt: {
      secret,
      issuer: 'school-management-api',
      audience: 'school-management-web',
      accessTtlSeconds: readInt('ACCESS_TOKEN_TTL_MINUTES', 15, 1, 1440) * 60,
    },
    refreshToken: {
      ttlSeconds: readInt('REFRESH_TOKEN_TTL_DAYS', 7, 1, 90) * 24 * 60 * 60,
      cookieName: 'refresh_token',
      cookiePath: '/api/auth',
      secureCookie: readBool('COOKIE_SECURE', false),
    },
    loginThrottle: {
      maxAttempts: readInt('LOGIN_MAX_ATTEMPTS', 5, 1, 100),
      windowSeconds: readInt('LOGIN_WINDOW_MINUTES', 15, 1, 1440) * 60,
    },
  };
  return cached;
}
