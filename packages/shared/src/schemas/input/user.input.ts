import { z } from 'zod';
import { Locale } from '../../types/enums';

export const updateProfileInput = z.object({
  name: z.string().min(2).max(100).optional(),
  locale: z.nativeEnum(Locale).optional(),
  avatar: z.string().url().optional(),
});

export const pushTokenInput = z.object({
  token: z.string().min(1),
});
