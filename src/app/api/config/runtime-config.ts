/** La URL es pública: se comparte con el navegador y no debe contener credenciales. */
export function apiUrlFromEnvironment(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('API_URL debe ser una URL absoluta HTTP o HTTPS.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API_URL debe ser una URL HTTP o HTTPS sin credenciales, parámetros ni fragmento.');
  }
  return url.href.replace(/\/+$/, '');
}
