import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../../api/inventario/movimiento-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type {
  NuevoMovimiento,
  TipoMovimiento,
  VarianteMovimiento,
} from '../../../api/interfaces/inventario/movimiento.interface';
import { AuthStore } from '../../../store/auth/auth.store';
import { canLeaveMovimiento } from './guards/pending-movimiento.guard';
import MovimientosPage from './movimientos-page';

@Component({ template: '' })
class OtherPage {}

describe('MovimientosPage (registro)', () => {
  let client: QueryClient;
  const listarAlmacenes = vi.fn();
  const buscarVariantes = vi.fn();
  const crear = vi.fn();
  const variante: VarianteMovimiento = {
    producto: { id: 'p1', nombre: 'Tornillo', activo: true },
    variante: { id: 'v1', sku: 'TOR-1', activo: true },
    cantidadBase: '8.000000',
    unidades: [{ id: 'u1', nombre: 'Unidad', simbolo: 'und', factorABase: '1' }],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    listarAlmacenes.mockResolvedValue([
      { id: 'a1', nombre: 'Principal' },
      { id: 'a2', nombre: 'Secundario' },
    ]);
    buscarVariantes.mockResolvedValue({
      data: [variante],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    crear.mockResolvedValue({ id: 'movimiento-1', tipo: 'salida', estado: 'confirmado' });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  async function mount(tipo: TipoMovimiento, permissions: string[]) {
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: MovimientoApi, useValue: { listarAlmacenes, buscarVariantes, crear } },
        provideRouter([
          {
            path: 'movimiento',
            component: MovimientosPage,
            data: { tipo },
            canDeactivate: [canLeaveMovimiento],
          },
          { path: 'otra', component: OtherPage },
        ]),
      ],
    });
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: permissions.map((code) => ({ code, systemCode: 'INVENTARIO' })),
    } as never);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/movimiento', MovimientosPage);
    await vi.waitFor(() => expect(page.almacenes.data()).toHaveLength(2));
    harness.detectChanges();
    return { page, harness };
  }

  function fill(
    page: MovimientosPage,
    harness: RouterTestingHarness,
    item = variante,
    cantidad = '2',
  ) {
    page.actualizarOrigen('a1');
    harness.detectChanges();
    page.actualizarFila({ ...page.filas()[0], cantidad });
    harness.detectChanges();
    page.detalles()[0].elegir(item);
    harness.detectChanges();
  }

  it('registra una salida, confirma su ID y limpia solo motivo y filas', async () => {
    const { page, harness } = await mount('salida', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.SALIDAS_CREATE,
    ]);
    fill(page, harness);
    page.actualizarMotivo('Entrega a cliente');
    await page.confirmar(new Event('submit'));

    const request = crear.mock.calls[0][0] as NuevoMovimiento;
    expect(request).toEqual({
      idempotenciaClave: expect.any(String),
      tipo: 'salida',
      almacenOrigenId: 'a1',
      motivo: 'Entrega a cliente',
      detalles: [{ varianteId: 'v1', unidadId: 'u1', cantidad: '2' }],
    });
    expect(request.idempotenciaClave).toMatch(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i);
    expect(page.confirmacion()).toBe('movimiento-1');
    expect(page.origen()).toBe('a1');
    expect(page.motivo()).toBe('');
    expect(page.filas()).toEqual([
      { id: 2, varianteId: '', unidadId: '', cantidad: '', costoUnitarioBase: '' },
    ]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('ID: movimiento-1');
  });

  it('envía el destino solo en traslados y valida que sea distinto del origen', async () => {
    const { page, harness } = await mount('traslado', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.TRASLADOS_CREATE,
    ]);
    fill(page, harness);
    page.actualizarDestino('a1');
    await page.confirmar(new Event('submit'));
    expect(page.error()).toContain('destino diferente');
    expect(crear).not.toHaveBeenCalled();
    page.actualizarDestino('a2');
    await page.confirmar(new Event('submit'));
    expect(crear.mock.calls[0][0]).toMatchObject({
      tipo: 'traslado',
      almacenOrigenId: 'a1',
      almacenDestinoId: 'a2',
    });
    expect(page.destino()).toBe('a2');
  });

  it('exige costo por unidad base en ajuste positivo, permite cero y no lo envía en negativo', async () => {
    const { page, harness } = await mount('ajuste', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.AJUSTES_CREATE,
    ]);
    fill(page, harness, variante, '1.25');
    page.actualizarMotivo('Conteo físico');
    await page.confirmar(new Event('submit'));
    expect(page.error()).toContain('costo por unidad base');
    page.actualizarFila({ ...page.filas()[0], costoUnitarioBase: '0' });
    harness.detectChanges();
    await page.confirmar(new Event('submit'));
    expect(crear.mock.calls[0][0]).toMatchObject({
      tipo: 'ajuste',
      almacenOrigenId: 'a1',
      motivo: 'Conteo físico',
      detalles: [{ varianteId: 'v1', unidadId: 'u1', cantidad: '1.25', costoUnitarioBase: '0' }],
    });
    expect(crear.mock.calls[0][0].almacenDestinoId).toBeUndefined();

    const inactive = {
      ...variante,
      producto: { ...variante.producto, activo: false },
      variante: { ...variante.variante, id: 'v2', activo: false },
    };
    fill(page, harness, inactive, '-1');
    page.actualizarMotivo('Merma');
    await page.confirmar(new Event('submit'));
    expect(crear.mock.calls[1][0].detalles).toEqual([
      { varianteId: 'v2', unidadId: 'u1', cantidad: '-1' },
    ]);
  });

  it('bloquea ajustes positivos de una variante inactiva incluso si se cambió la cantidad tras seleccionarla', async () => {
    const { page, harness } = await mount('ajuste', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.AJUSTES_CREATE,
    ]);
    const inactive = { ...variante, variante: { ...variante.variante, activo: false } };
    page.actualizarOrigen('a1');
    harness.detectChanges();
    page.actualizarFila({ ...page.filas()[0], cantidad: '-1' });
    harness.detectChanges();
    page.detalles()[0].elegir(inactive);
    page.actualizarFila({ ...page.filas()[0], cantidad: '1', costoUnitarioBase: '5' });
    page.actualizarMotivo('Corrección');
    harness.detectChanges();
    await page.confirmar(new Event('submit'));
    expect(page.error()).toContain('inactiva');
    expect(crear).not.toHaveBeenCalled();
  });

  it('rechazo definitivo conserva datos y permite corregir con clave nueva', async () => {
    crear.mockRejectedValueOnce(new HttpErrorResponse({ status: 400, statusText: 'Bad Request' }));
    const { page, harness } = await mount('salida', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.SALIDAS_CREATE,
    ]);
    fill(page, harness);
    await page.confirmar(new Event('submit'));
    expect(page.error()).toContain('No se registró');
    expect(page.confirmacion()).toBeNull();
    expect(page.pendiente()).toBeNull();
    expect(page.filas()[0].cantidad).toBe('2');
    page.actualizarFila({ ...page.filas()[0], cantidad: '1' });
    harness.detectChanges();
    await page.confirmar(new Event('submit'));
    expect(crear).toHaveBeenCalledTimes(2);
    expect(crear.mock.calls[1][0].idempotenciaClave).not.toBe(
      crear.mock.calls[0][0].idempotenciaClave,
    );
    expect(crear.mock.calls[1][0].detalles[0].cantidad).toBe('1');
  });

  it('fallo de red inmoviliza el envío y reintenta exactamente la misma clave y contenido', async () => {
    crear.mockRejectedValueOnce(new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }));
    const { page, harness } = await mount('salida', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.SALIDAS_CREATE,
    ]);
    fill(page, harness);
    const first = page.confirmar(new Event('submit'));
    await page.confirmar(new Event('submit'));
    await first;
    expect(crear).toHaveBeenCalledOnce();
    const pending = page.pendiente();
    expect(pending).toEqual(crear.mock.calls[0][0]);
    expect(page.confirmacion()).toBeNull();
    page.actualizarFila({ ...page.filas()[0], cantidad: '999' });
    page.actualizarOrigen('a2');
    page.actualizarMotivo('Alterado');
    page.agregar();
    page.quitarFila(page.filas()[0].id);
    expect(page.origen()).toBe('a1');
    expect(page.filas()).toHaveLength(1);
    expect(page.filas()[0].cantidad).toBe('2');
    expect(await TestBed.inject(Router).navigateByUrl('/otra')).toBe(false);
    await page.reintentar();
    expect(crear).toHaveBeenCalledTimes(2);
    expect(crear.mock.calls[1][0]).toBe(pending);
    expect(page.confirmacion()).toBe('movimiento-1');
    expect(page.pendiente()).toBeNull();
    expect(await TestBed.inject(Router).navigateByUrl('/otra')).toBe(true);
  });

  it('solo lectura impide el POST incluso llamando a confirmar directamente', async () => {
    const { page, harness } = await mount('salida', [PERMISSION_CODES.MOVIMIENTOS_READ]);
    fill(page, harness);
    await page.confirmar(new Event('submit'));
    expect(crear).not.toHaveBeenCalled();
    expect(page.error()).toContain('No tienes permiso');
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('button[type="submit"]')).toBeNull();
  });

  it('el permiso de otra operación no autoriza esta escritura', async () => {
    const { page, harness } = await mount('salida', [
      PERMISSION_CODES.MOVIMIENTOS_READ,
      PERMISSION_CODES.TRASLADOS_CREATE,
    ]);
    fill(page, harness);
    await page.confirmar(new Event('submit'));
    expect(crear).not.toHaveBeenCalled();
    expect(page.error()).toContain('No tienes permiso');
  });
});
