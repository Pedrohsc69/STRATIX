type EnvRecord = Record<string, string | undefined>;

function ensureRequired(env: EnvRecord, key: string) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is not defined`);
  }

  return value;
}

function ensureNumber(env: EnvRecord, key: string, fallback: string) {
  const value = env[key]?.trim() || fallback;
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a valid number`);
  }

  return String(parsed);
}

export function validateEnv(env: EnvRecord) {
  return {
    DATABASE_URL: ensureRequired(env, 'DATABASE_URL'),
    PORT: ensureNumber(env, 'PORT', '3000'),
    MONGO_URL: ensureRequired(env, 'MONGO_URL'),
    MONGO_DB: ensureRequired(env, 'MONGO_DB'),
    JWT_SECRET: ensureRequired(env, 'JWT_SECRET'),
    JWT_EXPIRES_IN: ensureRequired(env, 'JWT_EXPIRES_IN'),
    FRONTEND_URL: ensureRequired(env, 'FRONTEND_URL'),
    EMAIL_FROM: ensureRequired(env, 'EMAIL_FROM'),
    RESEND_API_KEY: ensureRequired(env, 'RESEND_API_KEY'),
  };
}
