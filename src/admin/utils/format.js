export function formatNumberShort(value) {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  } catch {
    const rounded = Math.round(num * 100) / 100;
    return String(rounded);
  }
} 