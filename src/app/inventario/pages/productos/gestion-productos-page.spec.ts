import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject } from 'rxjs';
import { ProductoApi } from '../../../api/inventario/product-api';
import GestionProductosPage from './gestion-productos-page';

describe('GestionProductosPage', () => {
  const productId = 'b020d35c-3d9e-4e2e-9798-c96033ef1015';
  const search = vi.fn();
  const getById = vi.fn();
  const params = new BehaviorSubject(convertToParamMap({}));
  const navigate = vi.fn().mockImplementation(async (_, options) => {
    params.next(convertToParamMap(options.queryParams.productoId
      ? { productoId: options.queryParams.productoId }
      : {}));
    return true;
  });
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    params.next(convertToParamMap({}));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: params.value }, queryParamMap: params } },
        { provide: ProductoApi, useValue: { search, getById } },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('abre sin selección ni petición y permite volver al asistente', () => {
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Selecciona un producto');
    expect(fixture.nativeElement.querySelector('a')?.getAttribute('href')).toBe('/admin/inventario/productos');
    expect(getById).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it('abre un enlace con UUID y muestra el detalle cargado', async () => {
    params.next(convertToParamMap({ productoId: productId }));
    getById.mockResolvedValue({ id: productId, nombre: 'Martillo', activo: false, unidadBaseId: 'u1' });
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cargando producto');
    await vi.waitFor(() => expect(fixture.componentInstance.productQuery.data()?.id).toBe(productId));
    fixture.detectChanges();
    expect(getById).toHaveBeenCalledExactlyOnceWith(productId);
    expect(fixture.nativeElement.textContent).toContain('Martillo');
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
  });

  it('señala un ID mal formado y permite descartarlo sin pedir detalle', () => {
    params.next(convertToParamMap({ productoId: 'no-es-un-uuid' }));
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('no es válido');
    expect(getById).not.toHaveBeenCalled();
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (item) => (item as HTMLButtonElement).textContent?.includes('Volver al selector'),
    ) as HTMLButtonElement;
    button.click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { productoId: null } }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Selecciona un producto');
  });

  it('presenta error recuperable para un ID inexistente', async () => {
    params.next(convertToParamMap({ productoId: productId }));
    getById.mockRejectedValue(new Error('404'));
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.productQuery.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no exista');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    expect(fixture.nativeElement.textContent).toContain('Volver al selector');
  });

  it('selecciona un resultado cambiando solo el parámetro de la ruta de gestión', () => {
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.componentInstance.selectProduct({ id: productId, nombre: 'Martillo', activo: true });
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { productoId: productId }, queryParamsHandling: 'merge',
    }));
  });

  it('reinicia la paginación local al cambiar la búsqueda', () => {
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.componentInstance.requestedPages.set(3);
    fixture.componentInstance.search('tornillos');
    expect(fixture.componentInstance.searchText()).toBe('tornillos');
    expect(fixture.componentInstance.requestedPages()).toBe(1);
  });

  it('conecta la búsqueda y selección del componente con el enlace de gestión', async () => {
    search.mockResolvedValue({
      items: [{ id: productId, nombre: 'Martillo', activo: true }],
      page: 1, limit: 20, totalItems: 1,
    });
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'martillo';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'martillo', page: 1, limit: 20 }));
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('li button')).not.toBeNull());
    (fixture.nativeElement.querySelector('li button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { productoId: productId },
    }));
  });
});
