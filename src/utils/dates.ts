// Utilidades de fecha en hora local (evita el desfase de toISOString(), que usa UTC)

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

// Devuelve la fecha en formato YYYY-MM-DD según la zona horaria local del dispositivo
export const localDateISO = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Devuelve la hora en formato HH:MM según la zona horaria local del dispositivo
export const localTimeHM = (date: Date = new Date()): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;
