/**
 * Utilidades para manejo seguro de fechas y horarios de tomas y dosis.
 */

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const DAYS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/**
 * Extrae año, mes y día de forma segura sin sesgos por zonas horarias.
 */
export function extractDateParts(input: string | Date | null | undefined): DateParts | null {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      return null;
    }
    return {
      year: input.getFullYear(),
      month: input.getMonth() + 1,
      day: input.getDate(),
    };
  }

  const str = String(input).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
    };
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

/**
 * Comprueba si dos fechas corresponden al mismo día del calendario.
 */
export function isSameCalendarDay(
  date1: string | Date | null | undefined,
  date2: string | Date | null | undefined,
): boolean {
  const p1 = extractDateParts(date1);
  const p2 = extractDateParts(date2);
  if (!p1 || !p2) {
    return false;
  }
  return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
}

/**
 * Comprueba si una fecha corresponde al día de hoy en hora local.
 */
export function isToday(date: string | Date | null | undefined): boolean {
  return isSameCalendarDay(date, new Date());
}

/**
 * Formato amigable de encabezado de día para la selección de dosis.
 * Ej: "Hoy · 27 de octubre", "Mañana · 28 de octubre", "Ayer · 26 de octubre".
 */
export function formatDayHeader(date: Date): string {
  const today = new Date();
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

  const dayNum = date.getDate();
  const monthName = MONTHS_ES[date.getMonth()];
  const dayName = DAYS_ES[date.getDay()];

  if (diffDays === 0) {
    return `Hoy · ${dayNum} de ${monthName}`;
  }
  if (diffDays === 1) {
    return `Mañana · ${dayNum} de ${monthName}`;
  }
  if (diffDays === -1) {
    return `Ayer · ${dayNum} de ${monthName}`;
  }
  return `${dayName} · ${dayNum} de ${monthName}`;
}

/**
 * Extrae la hora y minutos (HH:mm hs) sin distorsión horaria.
 */
export function formatTimeFromIso(isoString?: string | null): string | undefined {
  if (!isoString) {
    return undefined;
  }
  const match = String(isoString).match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]} hs`;
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return undefined;
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} hs`;
}
