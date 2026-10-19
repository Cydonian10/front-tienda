import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../../api/inventario/product-api';
import { UnidadProductoApi } from '../../../api/inventario/unidad-producto-api';
import { VarianteApi } from '../../../api/inventario/variante-api';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { productoAtributosQueryKey } from '../../actions/use-producto-atributos-action';
import {
  catalogoUnidadesQueryKey,
  productoUnidadesQueryKey,
} from '../../actions/use-producto-unidades-action';
import { variantesQueryKey } from '../../actions/use-variante-action';
import ProductosPage from './productos-page';

describe('ProductosPage: terminar revisión', () => {
  const product = {
    id: 'p1',
    nombre: 'Martillo',
    descripcion: null,
    activo: true,
    imagenes: [],
    unidadBaseId: 'u1',
    puedeCambiarUnidadBase: true,
  };
  const navigate = vi.fn().mockResolvedValue(true);
  const create = vi.fn();
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(productoAtributosQueryKey('p1'), []);
    client.setQueryData(variantesQueryKey('p1'), []);
    client.setQueryData(catalogoUnidadesQueryKey, [{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]);
    client.setQueryData(productoUnidadesQueryKey('p1'), []);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: ProductoApi,
          useValue: { create, update, listAttributes: vi.fn(), listUnidades: vi.fn() },
        },
        { provide: VarianteApi, useValue: { list: vi.fn() } },
        { provide: UnidadProductoApi, useValue: { list: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra la confirmación sin volver a guardar y reinicia solo el asistente al crear otro', () => {
    const fixture = TestBed.createComponent(ProductosPage);
    const page = fixture.componentInstance;
    page.product.set(product);
    page.step.set(3);
    fixture.detectChanges();

    expect(page.reviewStep()?.ready()).toBe(true);
    page.finish();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Producto listo');
    expect(fixture.nativeElement.textContent).toContain('Martillo');
    expect(fixture.nativeElement.querySelector('revision-step')).toBeNull();
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();

    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Crear otro producto'),
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(page.finished()).toBe(false);
    expect(page.product()).toBeNull();
    expect(page.step()).toBe(0);
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { productoId: null },
        queryParamsHandling: 'merge',
      }),
    );
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('no termina fuera de revisión o si alguna consulta sigue pendiente', () => {
    TestBed.overrideProvider(UnidadProductoApi, {
      useValue: { list: () => new Promise(() => {}) },
    });
    TestBed.inject(QueryClient).removeQueries({ queryKey: productoUnidadesQueryKey('p1') });
    const fixture = TestBed.createComponent(ProductosPage);
    const page = fixture.componentInstance;
    page.product.set(product);
    page.step.set(2);
    page.finish();
    expect(page.finished()).toBe(false);
    page.step.set(3);
    fixture.detectChanges();
    expect(page.reviewStep()?.ready()).toBe(false);
    page.finish();
    expect(page.finished()).toBe(false);
  });

  it('abre gestión desde el botón sin trasladar el producto del asistente', () => {
    const fixture = TestBed.createComponent(ProductosPage);
    fixture.componentInstance.product.set(product);
    fixture.detectChanges();

    const manageButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (element) => (element as HTMLButtonElement).textContent?.includes('Gestionar producto existente'),
    ) as HTMLButtonElement;
    manageButton.click();

    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/admin/inventario/productos/gestion']);
    expect(fixture.componentInstance.product()).toEqual(product);
    expect(fixture.componentInstance.mode()).toBe('create');
  });
});
