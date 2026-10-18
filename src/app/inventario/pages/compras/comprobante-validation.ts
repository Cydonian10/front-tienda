export const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024;

/** El servidor verifica también la firma real del contenido al recibirlo. */
export function comprobanteError(file: File): string | null {
  if (file.size < 1) return 'El comprobante no puede estar vacío.';
  if (file.size > MAX_COMPROBANTE_BYTES) return 'El comprobante supera el límite de 10 MB.';
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validMime: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  if (!extension || validMime[extension] !== file.type.toLowerCase()) {
    return 'Selecciona un PDF, JPG o PNG válido.';
  }
  return null;
}
