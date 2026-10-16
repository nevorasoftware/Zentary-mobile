// Traducción de mensajes de error del servidor a español claro para el usuario

// Por código del servidor (solo los genéricos; los demás mensajes del backend ya vienen en español)
const MENSAJES_POR_CODIGO: Record<string, string> = {
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  NO_TOKEN: 'Tu sesión expiró. Inicia sesión de nuevo.',
  INVALID_TOKEN: 'Tu sesión expiró. Inicia sesión de nuevo.',
  TENANT_REQUIRED: 'Tu cuenta no está asociada a una residencial. Contacta a la administración.',
  SERVER_ERROR: 'Ocurrió un problema en el servidor. Intenta de nuevo más tarde.',
};

// Mensajes en inglés conocidos (respuestas por defecto de Express y de la pasarela de pago)
const MENSAJES_EN_INGLES: Record<string, string> = {
  'Unauthorized': 'Tu sesión expiró. Inicia sesión de nuevo.',
  'Forbidden': 'No tienes permiso para realizar esta acción.',
  'Not Found': 'No se encontró lo que buscas.',
  'Internal Server Error': 'Ocurrió un problema en el servidor. Intenta de nuevo más tarde.',
  'Bad Gateway': 'El servidor no está disponible por ahora. Intenta de nuevo más tarde.',
  'Service Unavailable': 'El servidor no está disponible por ahora. Intenta de nuevo más tarde.',
  'Gateway Timeout': 'El servidor tardó demasiado en responder. Intenta de nuevo.',
  'Payload Too Large': 'La información enviada es demasiado grande.',
};

// Prefijos de mensajes que incluyen texto técnico en inglés a continuación
const PREFIJOS_EN_INGLES: Array<[string, string]> = [
  ['Error de Wompi', 'No se pudo procesar el pago con tarjeta. Intenta de nuevo.'],
];

// Palabras que delatan un mensaje en inglés sin traducción conocida
const PATRON_INGLES = /\b(the|is|are|not|failed|invalid|unauthorized|forbidden|found|too many|request|internal|server|timeout|cannot|unable|denied|must|missing)\b/i;

const MENSAJES_POR_ESTADO = (status?: number) => {
  if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró lo que buscas.';
  if (status === 429) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  if (status && status >= 500) return 'Ocurrió un problema en el servidor. Intenta de nuevo más tarde.';
  return 'No se pudo completar la solicitud. Intenta de nuevo.';
};

export const translateServerError = (status?: number, code?: string, message?: string): string => {
  const texto = (message || '').trim();
  if (code && MENSAJES_POR_CODIGO[code] && !texto) return MENSAJES_POR_CODIGO[code];
  if (MENSAJES_EN_INGLES[texto]) return MENSAJES_EN_INGLES[texto];
  const prefijo = PREFIJOS_EN_INGLES.find(([p]) => texto.startsWith(p));
  if (prefijo) return prefijo[1];
  if (!texto || PATRON_INGLES.test(texto)) {
    return (code && MENSAJES_POR_CODIGO[code]) || MENSAJES_POR_ESTADO(status);
  }
  return texto;
};
