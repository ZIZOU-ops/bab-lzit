import { TRPCError } from '@trpc/server';
import type { ErrorCode } from '@babloo/shared/errors';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly httpStatus: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toTRPCError(): TRPCError {
    const codeMap: Record<number, TRPCError['code']> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return new TRPCError({
      code: codeMap[this.httpStatus] ?? 'INTERNAL_SERVER_ERROR',
      message: this.message,
      cause: { code: this.code },
    });
  }
}

export class AuthError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 429);
  }
}
