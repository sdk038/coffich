/** Формат цены в узбекских сумах (разделитель тысяч — пробел). */
export function formatPriceUZS(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('ru-RU')} сум`;
}
