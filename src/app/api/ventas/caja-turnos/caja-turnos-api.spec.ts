import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CajaTurnosApi } from './caja-turnos-api';

describe('CajaTurnosApi', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }));
  afterEach(() => TestBed.resetTestingModule());

  it('abre un turno para la caja con el saldo inicial', async () => {
    const http = TestBed.inject(HttpTestingController);
    const turno = { id: 't1', cajaId: 'c1', fechaOperativa: '2026-10-31', fechaApertura: '2026-10-31T10:00:00Z', saldoInicial: '100.00' };
    const result = TestBed.inject(CajaTurnosApi).abrir('c1', { saldoInicial: '100.00' });
    const request = http.expectOne('http://localhost:3000/api/cajas/c1/turnos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ saldoInicial: '100.00' });
    request.flush(turno);
    await expect(result).resolves.toEqual(turno);
    http.verify();
  });

  it('permite abrir sin saldo inicial', async () => {
    const http = TestBed.inject(HttpTestingController);
    const result = TestBed.inject(CajaTurnosApi).abrir('c1');
    const request = http.expectOne('http://localhost:3000/api/cajas/c1/turnos');
    expect(request.request.body).toEqual({});
    request.flush({ id: 't1' });
    await expect(result).resolves.toEqual({ id: 't1' });
    http.verify();
  });

  it('cierra un turno con el efectivo contado', async () => {
    const http = TestBed.inject(HttpTestingController);
    const cierre = { id: 't1', cajaId: 'c1', usuarioCierreId: 'u1', fechaCierre: '2026-10-31T12:00:00Z', saldoInicial: '100.00', efectivoEsperado: '150.00', efectivoContado: '160.00', diferencia: '10.00', tipoCierre: 'turno' };
    const result = TestBed.inject(CajaTurnosApi).cerrar('c1', 't1', { efectivoContado: '160.00' });
    const request = http.expectOne('http://localhost:3000/api/cajas/c1/turnos/t1/cierre');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ efectivoContado: '160.00' });
    request.flush(cierre);
    await expect(result).resolves.toEqual(cierre);
    http.verify();
  });
});
