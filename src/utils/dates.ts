// Utilidades de fecha en hora local (evita el desfase de toISOString(), que usa UTC)

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

// Devuelve la fecha en formato YYYY-MM-DD según la zona horaria local del dispositivo
export const localDateISO = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Devuelve la hora en formato HH:MM según la zona horaria local del dispositivo
export const localTimeHM = (date: Date = new Date()): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidDateISO = (s: string): boolean => {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

export const isValidTimeHM = (s: string): boolean => TIME_RE.test(s);

// Convierte YYYY-MM-DD a Date local (medianoche local, sin desfase de UTC)
export const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Combina YYYY-MM-DD y HH:MM en un Date local
export const parseLocalDateTime = (dateISO: string, timeHM: string): Date => {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [h, min] = timeHM.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
};

// Fecha en formato local legible, por ejemplo "lunes 13 de octubre"
export const formatDateLocal = (dateISO: string): string => {
  if (!isValidDateISO(dateISO)) return dateISO;
  return parseLocalDate(dateISO)
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '');
};
