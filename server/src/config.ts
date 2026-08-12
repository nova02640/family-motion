import 'dotenv/config';

function required(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 2567),
  databaseUrl: required('DATABASE_URL', 'postgres://mir:mirpass@localhost:5432/mir_web'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  defaultMapId: process.env.DEFAULT_MAP_ID ?? 'village',
} as const;
