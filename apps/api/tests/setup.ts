import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

const apiRoot = resolve(__dirname, '..');
const colimaSocketPath = resolve(process.env.HOME ?? '', '.colima/default/docker.sock');

if (!process.env.DOCKER_HOST && existsSync(colimaSocketPath)) {
  process.env.DOCKER_HOST = `unix://${colimaSocketPath}`;
}

if (
  !process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE &&
  process.env.DOCKER_HOST?.includes('/.colima/')
) {
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE = '/var/run/docker.sock';
}

type StartedPostgresContainer = Awaited<ReturnType<PostgreSqlContainer['start']>>;

let postgresContainer: StartedPostgresContainer | undefined;
let redisContainer: StartedTestContainer | undefined;

export async function setup() {
  postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('babloo_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  const databaseUrl = postgresContainer.getConnectionUri();
  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';
  process.env.JWT_ACCESS_TTL = '15m';
  process.env.JWT_REFRESH_TTL = '30d';
  process.env.BCRYPT_ROUNDS = '4';
  process.env.OTP_TTL_MINUTES = '5';
  process.env.OTP_MAX_ATTEMPTS = '5';
  process.env.OTP_RATE_LIMIT_PER_15MIN = '3';
  process.env.SMS_PROVIDER = 'mock';
  process.env.PORT = '3000';
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGINS = 'http://localhost:8081';

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: apiRoot,
    env: process.env,
    stdio: 'pipe',
  });

  (globalThis as { __TEST_POSTGRES__?: StartedPostgresContainer }).__TEST_POSTGRES__ =
    postgresContainer;
  (globalThis as { __TEST_REDIS__?: StartedTestContainer }).__TEST_REDIS__ =
    redisContainer;
}

export async function teardown() {
  const postgres = (globalThis as { __TEST_POSTGRES__?: StartedPostgresContainer })
    .__TEST_POSTGRES__;
  const redis = (globalThis as { __TEST_REDIS__?: StartedTestContainer }).__TEST_REDIS__;

  if (redis) {
    await redis.stop();
  }

  if (postgres) {
    await postgres.stop();
  }
}

export default async function globalSetup() {
  await setup();
  return async () => {
    await teardown();
  };
}
