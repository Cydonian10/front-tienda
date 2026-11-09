import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from './env-dev';
import { apiUrlFromEnvironment } from './runtime-config';
import { environment } from '../../../environments/environment';

describe('configuración de la API', () => {
  afterEach(() => {
    delete window.__FRONT_CONFIG__;
    TestBed.resetTestingModule();
  });

  it('normaliza la URL pública configurada', () => {
    // La misma URL se utiliza para SSR y para el navegador.
    const url = apiUrlFromEnvironment(' https://api.ejemplo.com/api/ ');
    expect(url).toBe('https://api.ejemplo.com/api');
  });

  it('rechaza URL relativas, protocolos incompatibles y credenciales', () => {
    for (const valor of ['/api', 'file:///api', 'https://usuario:clave@ejemplo.com/api', 'https://ejemplo.com/api?q=1']) {
      expect(() => apiUrlFromEnvironment(valor)).toThrow();
    }
    const urlAusente = apiUrlFromEnvironment('  ');
    expect(urlAusente).toBeUndefined();
  });

  it('utiliza la configuración suministrada al navegador', () => {
    window.__FRONT_CONFIG__ = { apiUrl: 'https://api.ejemplo.com/api' };
    const configuracion = TestBed.inject(ENVIRONMENT);
    expect(configuracion.apiUrl).toBe('https://api.ejemplo.com/api');
  });

  it('usa el entorno de Angular cuando no hay configuración externa', () => {
    const configuracion = TestBed.inject(ENVIRONMENT);
    expect(configuracion.apiUrl).toBe(environment.apiUrl);
  });
});
