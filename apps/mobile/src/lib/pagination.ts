export function getPageItems<T>(page: unknown): T[] {
  if (!page || typeof page !== 'object') {
    return [];
  }

  const candidate = page as { items?: unknown[]; data?: unknown[] };
  if (Array.isArray(candidate.items)) {
    return candidate.items as T[];
  }

  if (Array.isArray(candidate.data)) {
    return candidate.data as T[];
  }

  return [];
}
