import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CompraApi } from '../../api/inventario/compra-api';
import { ExistenciaApi } from '../../api/inventario/existencia-api';
import { MovimientoApi } from '../../api/inventario/movimiento-api';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type { PeriodoActividadInventario } from '../../api/interfaces/inventario/resumen-reposicion.interface';
import { AuthStore } from '../../store/auth/auth.store';
import { resumenComprasQueryKey, resumenReposicionQueryKey, resumenSalidasQueryKey, useResumenCompras, useResumenReposicion, useResumenSalidas } from './use-dashboard-reposicion-action';

describe('consultas del dashboard de reposición', () => {
  let client: QueryClient;
  const reposicion = vi.fn();
  const compras = vi.fn();
  const salidas = vi.fn();
  const periodo: PeriodoActividadInventario = { desde: '2026-10-01', hasta: '2026-10-30' };

  beforeEach(() => {
    vi.resetAllMocks();
    reposicion.mockResolvedValue({ bajoMinimo: 1, agotadas: 0, alertas: [] });
    compras.mockResolvedValue({ total: 1, porDia: [], recientes: [] });
    salidas.mockResolvedValue({ total: 0, porDia: [], recientes: [] });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: ExistenciaApi, useValue: { resumenReposicion: reposicion } },
      { provide: CompraApi, useValue: { resumenInventario: compras } },
      { provide: MovimientoApi, useValue: { resumenSalidas: salidas } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: codes.map((code) => ({ systemCode: 'INVENTARIO', code })) } as never);
  }

  it('incluye los parámetros exactos en las claves, sin almacén para compras', () => {
    expect(resumenReposicionQueryKey('a1')).not.toEqual(resumenReposicionQueryKey('a2'));
    expect(resumenComprasQueryKey(periodo)).not.toEqual(resumenComprasQueryKey({ ...periodo, hasta: '2026-10-29' }));
    expect(resumenComprasQueryKey(periodo)).not.toEqual(resumenComprasQueryKey({ ...periodo, desde: '2026-10-02' }));
    expect(resumenSalidasQueryKey('a1', periodo)).not.toEqual(resumenSalidasQueryKey('a2', periodo));
    expect(resumenSalidasQueryKey('a1', periodo)).not.toEqual(resumenSalidasQueryKey('a1', { ...periodo, hasta: '2026-10-29' }));
    expect(resumenSalidasQueryKey('a1', periodo)).not.toEqual(resumenSalidasQueryKey('a1', { ...periodo, desde: '2026-10-02' }));
    expect(resumenComprasQueryKey(periodo)).toEqual(['compras', 'resumen-inventario', periodo.desde, periodo.hasta]);
  });

  it('no llama módulos no autorizados ni stock/salidas sin almacén', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ);
    const almacen = signal<string | null>(null);
    const rango = signal<PeriodoActividadInventario | null>(periodo);
    const [stock, purchase, output] = TestBed.runInInjectionContext(() => [
      useResumenReposicion(almacen), useResumenCompras(rango), useResumenSalidas(almacen, rango),
    ]);
    await vi.waitFor(() => expect(compras).toHaveBeenCalledExactlyOnceWith(periodo));
    expect(stock.fetchStatus()).toBe('idle');
    expect(output.fetchStatus()).toBe('idle');
    expect(reposicion).not.toHaveBeenCalled();
    expect(salidas).not.toHaveBeenCalled();
    grant(PERMISSION_CODES.EXISTENCIAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ);
    almacen.set('a1');
    await vi.waitFor(() => expect(reposicion).toHaveBeenCalledExactlyOnceWith('a1'));
    await vi.waitFor(() => expect(salidas).toHaveBeenCalledExactlyOnceWith('a1', periodo));
    expect(purchase.fetchStatus()).toBe('idle');
  });

  it('sin fechas válidas no consulta actividad aunque tenga ambos permisos', async () => {
    grant(PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ);
    const rango = signal<PeriodoActividadInventario | null>(null);
    const [purchase, output] = TestBed.runInInjectionContext(() => [
      useResumenCompras(rango), useResumenSalidas(() => 'a1', rango),
    ]);
    expect(purchase.fetchStatus()).toBe('idle');
    expect(output.fetchStatus()).toBe('idle');
    expect(compras).not.toHaveBeenCalled();
    expect(salidas).not.toHaveBeenCalled();
    rango.set(periodo);
    await vi.waitFor(() => expect(compras).toHaveBeenCalledWith(periodo));
    await vi.waitFor(() => expect(salidas).toHaveBeenCalledWith('a1', periodo));
  });
});
