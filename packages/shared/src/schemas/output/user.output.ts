import { z } from 'zod';
import { Locale, UserRole } from '../../types/enums';

export const userOutput = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  name: z.string(),
  role: z.nativeEnum(UserRole),
  locale: z.nativeEnum(Locale),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const authOutput = z.object({
  user: userOutput,
  accessToken: z.string(),
  refreshToken: z.string(),
});
