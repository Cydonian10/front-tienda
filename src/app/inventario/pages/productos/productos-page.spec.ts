import { convertToParamMap, ActivatedRoute, provideRouter, Router } from '@angular/router';
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
import { AuthStore } from '../../../store/auth/auth.store';
import { MarcaApi } from '../../../api/inventario/marca-api';
import { CategoriaApi } from '../../../api/inventario/categoria-api';
import { DatosGeneralesStep } from './components/datos-generales-step/datos-generales-step';

describe('ProductosPage: terminar revisión', () => {
  const product = {
    id: 'p1',
    nombre: 'Martillo',
    descripcion: null,
    activo: true,
    imagenes: [],
    unidadBaseId: 'u1',
    puedeCambiarUnidadBase: true,
    marca: { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
    categorias: [{ id: 'c1', nombre: 'Herramientas', activo: true }],
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
        provideRouter([]),
        {
          provide: AuthStore,
          useFactory: () => {
            const store = new AuthStore();
            store.setProfile({ isSuperAdmin: true, permissions: [] } as never);
            return store;
          },
        },
        provideTanStackQuery(client),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        {
          provide: ProductoApi,
          useValue: {
            create, update, listAttributes: vi.fn(),
            listUnidades: vi.fn().mockResolvedValue([{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]),
          },
        },
        { provide: VarianteApi, useValue: { list: vi.fn() } },
        { provide: MarcaApi, useValue: { list: vi.fn().mockResolvedValue({ items: [product.marca], page: 1, limit: 20, totalItems: 1 }) } },
        { provide: CategoriaApi, useValue: { list: vi.fn().mockResolvedValue({ items: [product.categorias[0]], page: 1, limit: 20, totalItems: 1 }) } },
        { provide: UnidadProductoApi, useValue: { list: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('con solo lectura abre la consulta y bloquea escrituras desde los manejadores', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: [{ code: 'PRODUCTOS_LEER', systemCode: 'INVENTARIO' }],
    } as never);
    const fixture = TestBed.createComponent(ProductosPage);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(
      ['/admin/inventario/productos/gestion'],
      expect.objectContaining({ replaceUrl: true }),
    );
    expect(fixture.nativeElement.querySelector('datos-generales-step')).toBeNull();
    await fixture.componentInstance.createProduct({
      nombre: 'No permitido',
      descripcion: '',
      activo: true,
      unidadBaseId: 'u1',
      imagenes: [],
      marcaId: 'm1',
      categoriasIds: ['c1'],
    });
    fixture.componentInstance.product.set(product);
    await fixture.componentInstance.updateProduct({
      nombre: 'No permitido',
      descripcion: '',
      activo: true,
      unidadBaseId: 'u1',
    });
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('muestra la confirmación sin volver a guardar y reinicia solo el asistente al crear otro', () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
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
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
    const fixture = TestBed.createComponent(ProductosPage);
    fixture.componentInstance.product.set(product);
    fixture.detectChanges();

    const manageButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (element) =>
        (element as HTMLButtonElement).textContent?.includes('Gestionar producto existente'),
    ) as HTMLButtonElement;
    manageButton.click();

    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/admin/inventario/productos/gestion']);
    expect(fixture.componentInstance.product()).toEqual(product);
    expect(fixture.componentInstance.mode()).toBe('create');
  });

  it('crea y avanza a variantes con marca y categorías seleccionadas', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
    create.mockResolvedValue(product);
    const fixture = TestBed.createComponent(ProductosPage);
    fixture.detectChanges();
    const step = fixture.debugElement.query((element) => element.componentInstance instanceof DatosGeneralesStep)
      .componentInstance as DatosGeneralesStep;
    await vi.waitFor(() => expect(step.loadingUnidades()).toBe(false));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('[aria-label="Marcas disponibles"] button')).toHaveLength(1);
      expect(fixture.nativeElement.querySelectorAll('[aria-label="Categorías disponibles"] button')).toHaveLength(1);
    });
    step.model.update((value) => ({ ...value, nombre: 'Martillo', unidadBaseId: 'u1' }));
    (fixture.nativeElement.querySelector('[aria-label="Marcas disponibles"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Categorías disponibles"] button') as HTMLButtonElement).click();
    expect(step.model().marcaId).toBe('m1');
    expect(step.model().categoriasIds).toEqual(['c1']);
    await step.save(new Event('submit'));
    await vi.waitFor(() => expect(fixture.componentInstance.step()).toBe(1));
    expect(create).toHaveBeenCalledWith({
      nombre: 'Martillo', descripcion: '', unidadBaseId: 'u1', activo: true,
      marcaId: 'm1', categoriasIds: ['c1'], imagenes: [],
    });
    expect(fixture.componentInstance.product()?.marca.nombre).toBe('Atlas');
  });
});
