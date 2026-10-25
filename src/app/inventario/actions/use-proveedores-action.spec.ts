import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProveedorApi } from '../../api/inventario/proveedor-api';
import { PERMISSION_CODES, type PermissionCode } from '../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../../auth/services/authorization.service';
import { comprasListadoQueryKey, proveedoresQueryKey } from './use-compras-action';
import {
  proveedorComprasQueryKey,
  proveedoresListadoKey,
  proveedoresListadoQueryKey,
  useCrearProveedor,
  useProveedorCompras,
  useProveedoresListado,
} from './use-proveedores-action';

describe('acciones de proveedores', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';
  const empty = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const list = vi.fn();
  const listCompras = vi.fn();
  const create = vi.fn();
  const allowed = signal<PermissionCode[]>([
    PERMISSION_CODES.PROVEEDORES_READ,
    PERMISSION_CODES.COMPRAS_READ,
    PERMISSION_CODES.PROVEEDORES_CREATE,
  ]);
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    allowed.set([
      PERMISSION_CODES.PROVEEDORES_READ,
      PERMISSION_CODES.COMPRAS_READ,
      PERMISSION_CODES.PROVEEDORES_CREATE,
    ]);
    list.mockResolvedValue(empty);
    listCompras.mockResolvedValue({ proveedor: { id }, resumen: { cantidadCompras: 0, totalDocumento: '0' }, ...empty });
    create.mockResolvedValue({ id, nombre: 'Acero', documento: null, contacto: null });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProveedorApi, useValue: { list, listCompras, create } },
        { provide: AuthorizationService, useValue: {
          hasPermission: (system: string, code: PermissionCode) =>
            system === 'INVENTARIO' && allowed().includes(code),
        } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('usa claves completas para listado y comparte la clave con el selector de Compras', async () => {
    const page = signal(1);
    const limit = signal(20);
    const nombre = signal('Acero');
    const documento = signal('204');
    const query = TestBed.runInInjectionContext(() =>
      useProveedoresListado(page, limit, nombre, documento),
    );
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, 'Acero', '204'));
    await vi.waitFor(() => expect(query.data()).toEqual(empty));
    expect(proveedoresListadoQueryKey(1, 20, 'Acero', '204')).toEqual(proveedoresQueryKey(1, 20, 'Acero', '204'));

    page.set(2);
    limit.set(10);
    nombre.set('');
    documento.set('205');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 10, undefined, '205'));
    expect(client.getQueryData(proveedoresListadoQueryKey(1, 20, 'Acero', '204'))).toEqual(empty);
    await vi.waitFor(() => expect(client.getQueryData(proveedoresListadoQueryKey(2, 10, '', '205'))).toEqual(empty));
  });

  it('no consulta el listado sin PROVEEDORES_LEER', async () => {
    allowed.set([]);
    TestBed.runInInjectionContext(() => useProveedoresListado(() => 1, () => 20, () => '', () => ''));
    await Promise.resolve();
    expect(list).not.toHaveBeenCalled();
  });

  it('incluye ID, fechas y paginación en la clave y bloquea un ID o filtro inválido', async () => {
    const proveedorId = signal('no-es-uuid');
    const filtro = signal<{ desde?: string; hasta?: string; page: number; limit: number } | null>(null);
    TestBed.runInInjectionContext(() => useProveedorCompras(proveedorId, filtro));
    await Promise.resolve();
    expect(listCompras).not.toHaveBeenCalled();

    filtro.set({ desde: '2026-10-01', hasta: '2026-10-25', page: 2, limit: 10 });
    await Promise.resolve();
    expect(listCompras).not.toHaveBeenCalled();

    proveedorId.set(id);
    await vi.waitFor(() => expect(listCompras).toHaveBeenCalledWith(id, filtro()));
    await vi.waitFor(() => expect(client.getQueryData(proveedorComprasQueryKey(id, filtro()))).toBeDefined());
    filtro.set({ desde: '2026-10-01', page: 1, limit: 20 });
    await vi.waitFor(() => expect(listCompras).toHaveBeenCalledWith(id, filtro()));
    expect(proveedorComprasQueryKey(id, filtro())).toEqual([
      'proveedores', 'compras', id, '2026-10-01', null, 1, 20,
    ]);
  });

  it('requiere ambos permisos de lectura para consultar el informe', async () => {
    allowed.set([PERMISSION_CODES.PROVEEDORES_READ]);
    TestBed.runInInjectionContext(() => useProveedorCompras(() => id, () => ({ page: 1, limit: 20 })));
    await Promise.resolve();
    expect(listCompras).not.toHaveBeenCalled();
  });

  it('verifica permiso al mutar e invalida solo listados de proveedores tras el alta', async () => {
    const dto = { nombre: 'Acero' };
    client.setQueryData(proveedoresListadoQueryKey(1, 20, '', ''), empty);
    client.setQueryData(proveedoresListadoQueryKey(2, 20, 'Acero', ''), empty);
    client.setQueryData(proveedorComprasQueryKey(id, { page: 1, limit: 20 }), empty);
    client.setQueryData(comprasListadoQueryKey(1, 20, ''), empty);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = TestBed.runInInjectionContext(() => useCrearProveedor());

    allowed.set([PERMISSION_CODES.PROVEEDORES_READ]);
    await expect(mutation.mutateAsync(dto)).rejects.toThrow('No tienes permiso');
    expect(create).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();

    allowed.set([PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.PROVEEDORES_CREATE]);
    await expect(mutation.mutateAsync(dto)).resolves.toMatchObject({ id });
    expect(create).toHaveBeenCalledExactlyOnceWith(dto);
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: proveedoresListadoKey });
    expect(client.getQueryState(proveedoresListadoQueryKey(1, 20, '', ''))?.isInvalidated).toBe(true);
    expect(client.getQueryState(proveedoresListadoQueryKey(2, 20, 'Acero', ''))?.isInvalidated).toBe(true);
    expect(client.getQueryState(proveedorComprasQueryKey(id, { page: 1, limit: 20 }))?.isInvalidated).toBe(false);
    expect(client.getQueryState(comprasListadoQueryKey(1, 20, ''))?.isInvalidated).toBe(false);
  });

  it('no invalida el listado ante un conflicto HTTP', async () => {
    const error = { status: 409 };
    create.mockRejectedValue(error);
    client.setQueryData(proveedoresListadoQueryKey(1, 20, '', ''), empty);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutation = TestBed.runInInjectionContext(() => useCrearProveedor());
    await expect(mutation.mutateAsync({ nombre: 'Acero', documento: '204' })).rejects.toBe(error);
    expect(invalidate).not.toHaveBeenCalled();
    expect(client.getQueryState(proveedoresListadoQueryKey(1, 20, '', ''))?.isInvalidated).toBe(false);
  });
});
