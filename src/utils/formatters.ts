/**
 * Currency formatter (e.g. $ 1.250,00 or $ 0.00)
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(abs)
    .replace('ARS', '$')
    .trim();

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Formats a date string (YYYY-MM-DD) to DD/MM/AA
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
  }
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const shortYear = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${shortYear}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns Spanish name for month and year, e.g. "Octubre 2026"
 */
export function formatMonthYear(year: number, monthIndex: number): string {
  const date = new Date(year, monthIndex, 1);
  const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${year}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
