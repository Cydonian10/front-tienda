import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { productosBusquedaQueryKey } from '../../../../actions/use-productos-action';
import { ProductoSelector } from './producto-selector';

describe('ProductoSelector', () => {
  const search = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { search } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  function enter(fixture: ComponentFixture<ProductoSelector>, text: string) {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.componentRef.setInput('searchText', text);
    fixture.componentRef.setInput('requestedPages', 1);
    fixture.detectChanges();
  }

  it('no busca antes de dos caracteres y diferencia vacío de sin resultados', async () => {
    search.mockResolvedValue({ items: [], page: 1, limit: 20, totalItems: 0 });
    const fixture = TestBed.createComponent(ProductoSelector);
    fixture.detectChanges();
    enter(fixture, 'm');
    expect(search).not.toHaveBeenCalled();
    enter(fixture, 'ma');
    await vi.waitFor(() => expect(search).toHaveBeenCalledExactlyOnceWith({ q: 'ma', page: 1, limit: 20 }));
    await vi.waitFor(() => expect(fixture.componentInstance.pageQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay productos');
  });

  it('señala inactivos, permite selección con botón nativo y carga otra página remota', async () => {
    const first = { id: 'p1', nombre: 'Martillo', activo: false };
    const second = { id: 'p2', nombre: 'Martillo de goma', activo: true };
    search.mockImplementation(({ page }) => Promise.resolve({
      items: page === 1 ? [first] : [second], page, limit: 20, totalItems: 2,
    }));
    const fixture = TestBed.createComponent(ProductoSelector);
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    fixture.detectChanges();
    enter(fixture, 'martillo');
    await vi.waitFor(() => expect(fixture.componentInstance.results()).toEqual([first]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
    const productButton = fixture.nativeElement.querySelector('li button') as HTMLButtonElement;
    productButton.focus();
    expect(document.activeElement).toBe(productButton);
    productButton.click();
    expect(selected).toHaveBeenCalledWith(first);

    const more = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.includes('Cargar más'),
    ) as HTMLButtonElement;
    fixture.componentInstance.moreRequested.subscribe(() => fixture.componentRef.setInput('requestedPages', 2));
    more.click();
    fixture.detectChanges();
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'martillo', page: 2, limit: 20 }));
    await vi.waitFor(() => expect(fixture.componentInstance.results()).toEqual([first, second]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li button')).toHaveLength(2);
    expect(client.getQueryData(productosBusquedaQueryKey('martillo', 2, 20))).toMatchObject({ page: 2 });
  });

  it('muestra carga y error con reintento sin perder páginas cargadas', async () => {
    let rejectFirst!: (reason: Error) => void;
    search.mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }));
    const fixture = TestBed.createComponent(ProductoSelector);
    fixture.detectChanges();
    enter(fixture, 'clavos');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Buscando productos');
    rejectFirst(new Error('503'));
    await vi.waitFor(() => expect(fixture.componentInstance.error()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar búsqueda');

    search.mockResolvedValue({ items: [{ id: 'p1', nombre: 'Clavos', activo: true }], page: 1, limit: 20, totalItems: 1 });
    fixture.componentInstance.retry();
    await vi.waitFor(() => expect(fixture.componentInstance.results()).toHaveLength(1));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Clavos');
  });

  it('ignora resultados atrasados al cambiar el término de búsqueda', async () => {
    let finishPrevious!: (value: unknown) => void;
    search.mockImplementation(({ q }) => q === 'ma'
      ? new Promise((resolve) => { finishPrevious = resolve; })
      : Promise.resolve({ items: [{ id: 'p2', nombre: 'Clavos', activo: true }], page: 1, limit: 20, totalItems: 1 }));
    const fixture = TestBed.createComponent(ProductoSelector);
    fixture.detectChanges();
    enter(fixture, 'ma');
    await vi.waitFor(() => expect(search).toHaveBeenCalledWith({ q: 'ma', page: 1, limit: 20 }));
    enter(fixture, 'cl');
    await vi.waitFor(() => expect(fixture.componentInstance.results()[0]?.nombre).toBe('Clavos'));
    finishPrevious({ items: [{ id: 'p1', nombre: 'Martillo', activo: true }], page: 1, limit: 20, totalItems: 1 });
    await vi.waitFor(() => expect(client.getQueryData(productosBusquedaQueryKey('ma', 1, 20))).toBeDefined());
    expect(fixture.componentInstance.results()[0]?.nombre).toBe('Clavos');
  });
});
