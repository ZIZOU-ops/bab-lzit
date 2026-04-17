function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatShortDate(value: string | Date) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = pad(date.getFullYear() % 100);

  return `${day}/${month}/${year}`;
}
