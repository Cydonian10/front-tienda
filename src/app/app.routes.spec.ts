import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('Rutas principales', () => {
  it('redirige la raíz y las rutas desconocidas a la web pública', () => {
    // Localizar las rutas de entrada y de respaldo.
    const rutaInicial = routes.find((ruta) => ruta.path === '');
    const rutaDesconocida = routes.find((ruta) => ruta.path === '**');

    expect(rutaInicial?.pathMatch).toBe('full');
    expect(rutaInicial?.redirectTo).toBe('vsqz');
    expect(rutaDesconocida?.redirectTo).toBe('vsqz');
  });
});
