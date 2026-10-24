import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CategoriaApi } from '../../../../../api/inventario/categoria-api';
import { MarcaApi } from '../../../../../api/inventario/marca-api';
import { CatalogoProductoSelector } from './catalogo-producto-selector';

describe('CatalogoProductoSelector', () => {
  const brand = { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null };
  const category = { id: 'c1', nombre: 'Herramientas', activo: true, descripcion: null };
  const brands = vi.fn();
  const categories = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    brands.mockResolvedValue({ items: [brand], page: 1, limit: 20, totalItems: 21 });
    categories.mockResolvedValue({ items: [category], page: 1, limit: 20, totalItems: 21 });
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideTanStackQuery(client),
      { provide: MarcaApi, useValue: { list: brands } },
      { provide: CategoriaApi, useValue: { list: categories } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('selecciona una sola marca activa, pagina y nunca consulta el otro catálogo', async () => {
    const fixture = TestBed.createComponent(CatalogoProductoSelector);
    fixture.componentRef.setInput('kind', 'marca');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.options()).toEqual([brand]));
    expect(brands).toHaveBeenCalledWith({ activo: true, page: 1, limit: 20 });
    expect(categories).not.toHaveBeenCalled();
    const selection = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selection);
    fixture.componentInstance.choose(brand);
    expect(selection).toHaveBeenCalledWith([brand]);
    fixture.componentInstance.searchFor('atl');
    fixture.componentInstance.page.set(2);
    await vi.waitFor(() => expect(brands).toHaveBeenCalledWith({ q: 'atl', activo: true, page: 2, limit: 20 }));
    fixture.componentInstance.searchFor('a');
    await vi.waitFor(() => expect(brands).toHaveBeenCalledWith({ activo: true, page: 1, limit: 20 }));
  });

  it('permite varias categorías y mantiene las elegidas fuera de la página de búsqueda', async () => {
    const fixture = TestBed.createComponent(CatalogoProductoSelector);
    fixture.componentRef.setInput('kind', 'categoria');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.options()).toEqual([category]));
    expect(brands).not.toHaveBeenCalled();
    const selection = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(selection);
    fixture.componentInstance.choose(category);
    expect(selection).toHaveBeenCalledWith([category]);
    fixture.componentRef.setInput('selected', [category]);
    fixture.componentInstance.page.set(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Herramientas');
    fixture.componentInstance.choose(category);
    expect(selection).toHaveBeenCalledTimes(1);
    fixture.componentInstance.remove('c1');
    expect(selection).toHaveBeenLastCalledWith([]);
  });

  it('no ofrece inactivos para nueva asignación y distingue un fallo recuperable', async () => {
    brands.mockResolvedValueOnce({ items: [{ ...brand, activo: false }], page: 1, limit: 20, totalItems: 1 });
    const fixture = TestBed.createComponent(CatalogoProductoSelector);
    fixture.componentRef.setInput('kind', 'marca');
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.marcas.data()).toBeDefined());
    expect(fixture.componentInstance.options()).toEqual([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ir a Marcas');
    brands.mockRejectedValueOnce(new Error('Servidor no disponible'));
    fixture.componentInstance.searchFor('nuevo');
    await vi.waitFor(() => expect(fixture.componentInstance.failed()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });
});
