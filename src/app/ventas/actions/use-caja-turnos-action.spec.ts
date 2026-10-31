import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CajaTurnosApi } from '../../api/ventas/caja-turnos/caja-turnos-api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { cajasQueryKey } from './use-cajas-action';
import { useCajaTurnos } from './use-caja-turnos-action';

describe('useCajaTurnos', () => {
  const abrir = vi.fn();
  const success = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient();
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: CajaTurnosApi, useValue: { abrir } },
      { provide: ToastService, useValue: { success } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

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
});
