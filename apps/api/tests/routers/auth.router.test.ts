import { TRPCError } from '@trpc/server';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/prisma';
import { redis } from '../../src/lib/redis';
import { createTestCaller, createTestUser, resetDatabase } from '../helpers';

describe('auth.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('signup with email succeeds and returns tokens', async () => {
    const caller = createTestCaller();

    const result = await caller.auth.signup({
      email: 'client@babloo.test',
      password: 'Password123!',
      fullName: 'Client User',
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('signup with phone succeeds', async () => {
    const caller = createTestCaller();

    const result = await caller.auth.signup({
      phone: '0661234567',
      fullName: 'Phone User',
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('signup with existing email returns CONFLICT', async () => {
    const caller = createTestCaller();

    await caller.auth.signup({
      email: 'duplicate@babloo.test',
      password: 'Password123!',
      fullName: 'Dup',
    });

    await expect(
      caller.auth.signup({
        email: 'duplicate@babloo.test',
        password: 'Password123!',
        fullName: 'Dup2',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<TRPCError>);
  });

  it('signup with no email or phone returns BAD_REQUEST', async () => {
    const caller = createTestCaller();

    await expect(
      caller.auth.signup({
        fullName: 'No Identifier',
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    } satisfies Partial<TRPCError>);
  });

  it('login with correct credentials returns tokens', async () => {
    const caller = createTestCaller();
    const { user, password } = await createTestUser({
      email: 'login@babloo.test',
    });

    const result = await caller.auth.login({
      email: user.email!,
      password,
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('login with wrong password returns UNAUTHORIZED', async () => {
    const caller = createTestCaller();
    const { user } = await createTestUser({ email: 'wrong@babloo.test' });

    await expect(
      caller.auth.login({
        email: user.email!,
        password: 'NotThePassword',
      }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);
  });

  it('login normalizes email to lowercase', async () => {
    const caller = createTestCaller();
    const { password } = await createTestUser({
      email: 'client@babloo.test',
    });

    const result = await caller.auth.login({
      email: 'CLIENT@Babloo.Test',
      password,
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('OTP request succeeds', async () => {
    const caller = createTestCaller();

    const result = await caller.auth.otpRequest({
      phone: '0661234567',
      purpose: 'login',
    });

    expect(result.challengeId).toBeTruthy();
  });

  it('OTP verify with correct code returns tokens', async () => {
    const caller = createTestCaller();

    const challenge = await caller.auth.otpRequest({
      phone: '0661234567',
      purpose: 'login',
    });

    const result = await caller.auth.otpVerify({
      challengeId: challenge.challengeId,
      code: '123456',
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('OTP verify with wrong code returns error', async () => {
    const caller = createTestCaller();

    const challenge = await caller.auth.otpRequest({
      phone: '0661234567',
      purpose: 'login',
    });

    await expect(
      caller.auth.otpVerify({
        challengeId: challenge.challengeId,
        code: '999999',
      }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);
  });

  it('refresh with valid token returns new tokens', async () => {
    const caller = createTestCaller();
    const signup = await caller.auth.signup({
      email: 'refresh@babloo.test',
      password: 'Password123!',
      fullName: 'Refresh User',
    });

    const rotated = await caller.auth.refresh({
      refreshToken: signup.refreshToken,
    });

    expect(rotated.accessToken).toBeTruthy();
    expect(rotated.refreshToken).toBeTruthy();
    expect(rotated.refreshToken).not.toBe(signup.refreshToken);
  });

  it('refresh with revoked token revokes entire family', async () => {
    const caller = createTestCaller();
    const signup = await caller.auth.signup({
      email: 'theft@babloo.test',
      password: 'Password123!',
      fullName: 'Theft User',
    });

    const rotated = await caller.auth.refresh({
      refreshToken: signup.refreshToken,
    });

    await expect(
      caller.auth.refresh({ refreshToken: signup.refreshToken }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);

    await expect(
      caller.auth.refresh({ refreshToken: rotated.refreshToken }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);
  });

  it('logout revokes the specific token family', async () => {
    const signupCaller = createTestCaller();
    const signup = await signupCaller.auth.signup({
      email: 'logout@babloo.test',
      password: 'Password123!',
      fullName: 'Logout User',
    });

    const user = await db.user.findUniqueOrThrow({ where: { email: 'logout@babloo.test' } });
    const authedCaller = createTestCaller({ id: user.id, role: user.role });

    await authedCaller.auth.logout({ refreshToken: signup.refreshToken });

    await expect(
      signupCaller.auth.refresh({ refreshToken: signup.refreshToken }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);
  });

  it('logoutAll revokes all tokens for user', async () => {
    const publicCaller = createTestCaller();

    const signup = await publicCaller.auth.signup({
      email: 'logout-all@babloo.test',
      password: 'Password123!',
      fullName: 'Logout All User',
    });

    const rotated = await publicCaller.auth.refresh({
      refreshToken: signup.refreshToken,
    });

    const user = await db.user.findUniqueOrThrow({ where: { email: 'logout-all@babloo.test' } });
    const authedCaller = createTestCaller({ id: user.id, role: user.role });

    await authedCaller.auth.logoutAll();

    await expect(
      publicCaller.auth.refresh({ refreshToken: signup.refreshToken }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);

    await expect(
      publicCaller.auth.refresh({ refreshToken: rotated.refreshToken }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    } satisfies Partial<TRPCError>);
  });
});
