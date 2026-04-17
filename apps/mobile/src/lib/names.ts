const LEADING_COMPOUND_PARTICLES = new Set([
  'el',
  'al',
  'ben',
  'bin',
  'ibn',
  'abou',
  'abu',
  'ould',
  'ait',
  'aït',
]);

export function getGreetingName(fullName: string | null | undefined) {
  const normalized = fullName?.trim().replace(/\s+/g, ' ') ?? '';
  if (!normalized) {
    return '';
  }

  const parts = normalized.split(' ');
  if (parts.length === 1) {
    return parts[0];
  }

  const firstPart = parts[0].toLocaleLowerCase();

  // Moroccan/Arabic compound family names can start with particles like
  // "El" or "Ben". In that case the given name is often the last token.
  if (parts.length >= 3 && LEADING_COMPOUND_PARTICLES.has(firstPart)) {
    return parts[parts.length - 1];
  }

  return parts[0];
}
