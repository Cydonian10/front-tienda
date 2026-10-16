import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { UnidadProductoApi } from '../../../../../api/inventario/unidad-producto-api';
import { VarianteApi } from '../../../../../api/inventario/variante-api';
import { ToastService } from '../../../../../shared/services/toast/toast.service';
import { productoAtributosQueryKey } from '../../../../actions/use-producto-atributos-action';
import {
  catalogoUnidadesQueryKey,
  productoUnidadesQueryKey,
} from '../../../../actions/use-producto-unidades-action';
import { variantesQueryKey } from '../../../../actions/use-variante-action';
import { RevisionStep } from './revision-step';

describe('RevisionStep', () => {
  afterEach(() => TestBed.resetTestingModule());

  const product = {
    id: 'p1',
    nombre: 'Martillo',
    descripcion: null,
    activo: true,
    imagenes: [],
    unidadBaseId: 'u1',
  };

  it('reutiliza variantes, atributos y unidades en caché para revisar el producto', () => {
    const client = new QueryClient();
    client.setQueryData(productoAtributosQueryKey('p1'), [
      { atributoId: 'a1', atributo: 'Color', productoId: 'p1' },
    ]);
    client.setQueryData(variantesQueryKey('p1'), [
      {
        id: 'v1',
        sku: 'SKU-1',
        precio: '10.00',
        codigoBarras: null,
        valores: [{ atributoId: 'a1', valor: 'Negro' }],
        imagenes: [],
      },
    ]);
    client.setQueryData(catalogoUnidadesQueryKey, [
      { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
      { id: 'u2', nombre: 'Caja', simbolo: 'cja' },
    ]);
    client.setQueryData(productoUnidadesQueryKey('p1'), [
      { id: 'as1', productoId: 'p1', unidadId: 'u2', factorABase: '12.5' },
    ]);
    const listAttributes = vi.fn();
    const list = vi.fn();
    const listUnits = vi.fn();
    const listCatalog = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { listAttributes, listUnidades: listCatalog } },
        { provide: VarianteApi, useValue: { list } },
        { provide: UnidadProductoApi, useValue: { list: listUnits } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(RevisionStep);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SKU-1');
    expect(fixture.nativeElement.textContent).toContain('Color: Negro');
    expect(fixture.nativeElement.textContent).toContain('Caja (cja)');
    expect(fixture.nativeElement.textContent).toContain('12.5');
    expect(fixture.componentInstance.ready()).toBe(true);
    expect(listAttributes).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
    expect(listUnits).not.toHaveBeenCalled();
    expect(listCatalog).not.toHaveBeenCalled();
  });

  it('bloquea el cierre mientras falla una consulta y permite reintentar', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(productoAtributosQueryKey('p1'), []);
    client.setQueryData(variantesQueryKey('p1'), []);
    client.setQueryData(catalogoUnidadesQueryKey, [{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]);
    const listUnits = vi
      .fn()
      .mockRejectedValueOnce(new Error('Sin conexión'))
      .mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { listAttributes: vi.fn(), listUnidades: vi.fn() } },
        { provide: VarianteApi, useValue: { list: vi.fn() } },
        { provide: UnidadProductoApi, useValue: { list: listUnits } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(RevisionStep);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    expect(fixture.componentInstance.ready()).toBe(false);
    await vi.waitFor(() => expect(fixture.componentInstance.unitsError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las unidades');
    fixture.componentInstance.retryUnits();
    await vi.waitFor(() => expect(fixture.componentInstance.ready()).toBe(true));
    expect(listUnits).toHaveBeenCalledTimes(2);
  });
});
