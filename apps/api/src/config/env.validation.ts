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
  const mongoUrl = env.MONGO_URL?.trim() || env.MONGODB_URI?.trim();
  const mongoDb = env.MONGO_DB?.trim() || env.MONGODB_DATABASE?.trim();
  const emailDemoMode = env.EMAIL_DEMO_MODE?.trim() === 'true' ? 'true' : 'false';

  if (!mongoUrl) {
    throw new Error('MONGO_URL or MONGODB_URI is not defined');
  }

  if (!mongoDb) {
    throw new Error('MONGO_DB or MONGODB_DATABASE is not defined');
  }

  return {
    DATABASE_URL: ensureRequired(env, 'DATABASE_URL'),
    PORT: ensureNumber(env, 'PORT', '3000'),
    MONGO_URL: mongoUrl,
    MONGO_DB: mongoDb,
    MONGODB_URI: mongoUrl,
    MONGODB_DATABASE: mongoDb,
    JWT_SECRET: ensureRequired(env, 'JWT_SECRET'),
    JWT_EXPIRES_IN: ensureRequired(env, 'JWT_EXPIRES_IN'),
    FRONTEND_URL: ensureRequired(env, 'FRONTEND_URL'),
    EMAIL_FROM: ensureRequired(env, 'EMAIL_FROM'),
    EMAIL_DEMO_MODE: emailDemoMode,
    RESEND_API_KEY: ensureRequired(env, 'RESEND_API_KEY'),
  };
}
