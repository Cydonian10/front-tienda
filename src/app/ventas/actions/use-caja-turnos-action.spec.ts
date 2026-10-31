import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CajaTurnosApi } from '../../api/ventas/caja-turnos/caja-turnos-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { cajasQueryKey } from './use-cajas-action';
import { resumenTurnoQueryKey, useCajaTurnos, useResumenTurno } from './use-caja-turnos-action';

describe('useCajaTurnos', () => {
  const abrir = vi.fn();
  const cerrar = vi.fn();
  const resumen = vi.fn();
  const success = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient();
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: CajaTurnosApi, useValue: { abrir, cerrar, resumen } },
      { provide: ToastService, useValue: { success } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('carga el resumen y distingue las claves de caja y turno', async () => {
    const caja = signal('c1');
    const turno = signal('t1');
    resumen.mockImplementation(async (cajaId: string, turnoId: string) => ({ id: turnoId, cajaId }));
    const query = TestBed.runInInjectionContext(() => useResumenTurno(caja, turno));
    TestBed.tick();
    await vi.waitFor(() => expect(query.data()).toEqual({ id: 't1', cajaId: 'c1' }));
    expect(client.getQueryData(resumenTurnoQueryKey('c1', 't1'))).toEqual({ id: 't1', cajaId: 'c1' });
    caja.set('c2');
    turno.set('t2');
    TestBed.tick();
    await vi.waitFor(() => expect(query.data()).toEqual({ id: 't2', cajaId: 'c2' }));
    expect(resumen).toHaveBeenCalledWith('c1', 't1');
    expect(resumen).toHaveBeenCalledWith('c2', 't2');
    expect(client.getQueryData(resumenTurnoQueryKey('c1', 't1'))).toEqual({ id: 't1', cajaId: 'c1' });
    expect(resumenTurnoQueryKey('c1', 't1')).not.toEqual(resumenTurnoQueryKey('c2', 't1'));
    expect(resumenTurnoQueryKey('c1', 't1')).not.toEqual(resumenTurnoQueryKey('c1', 't2'));
  });

  it('abre el turno e invalida los listados de cajas', async () => {
    const key = cajasQueryKey({ estado: 'activas' });
    client.setQueryData(key, []);
    abrir.mockResolvedValue({ id: 't1' });
    const { abrirMutation } = TestBed.runInInjectionContext(() => useCajaTurnos());
    await abrirMutation.mutateAsync({ cajaId: 'c1', dto: { saldoInicial: '10' } });
    expect(abrir).toHaveBeenCalledWith('c1', { saldoInicial: '10' });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(success).toHaveBeenCalled();
  });

  it('no invalida ni notifica éxito si falla la apertura', async () => {
    const key = cajasQueryKey({});
    client.setQueryData(key, []);
    abrir.mockRejectedValue(new Error('Error'));
    const { abrirMutation } = TestBed.runInInjectionContext(() => useCajaTurnos());
    await expect(abrirMutation.mutateAsync({ cajaId: 'c1' })).rejects.toThrow('Error');
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(success).not.toHaveBeenCalled();
  });

  it('cierra el turno e invalida los listados de cajas', async () => {
    const key = cajasQueryKey({ estado: 'activas' });
    client.setQueryData(key, []);
    cerrar.mockResolvedValue({ id: 't1' });
    const { cerrarMutation } = TestBed.runInInjectionContext(() => useCajaTurnos());
    await cerrarMutation.mutateAsync({ cajaId: 'c1', turnoId: 't1', dto: { efectivoContado: '160.00', efectivoEsperadoConfirmado: '150.00' } });
    expect(cerrar).toHaveBeenCalledWith('c1', 't1', { efectivoContado: '160.00', efectivoEsperadoConfirmado: '150.00' });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(success).toHaveBeenCalledWith('Turno cerrado correctamente.');
  });

  it('no invalida ni notifica éxito si falla el cierre', async () => {
    const key = cajasQueryKey({});
    client.setQueryData(key, []);
    cerrar.mockRejectedValue(new Error('Error'));
    const { cerrarMutation } = TestBed.runInInjectionContext(() => useCajaTurnos());
    await expect(cerrarMutation.mutateAsync({ cajaId: 'c1', turnoId: 't1', dto: { efectivoContado: '0', efectivoEsperadoConfirmado: '0' } })).rejects.toThrow('Error');
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(success).not.toHaveBeenCalled();
  });
});
