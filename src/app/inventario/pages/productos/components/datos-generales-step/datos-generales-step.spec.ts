import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CategoriaApi } from '../../../../../api/inventario/categoria-api';
import { MarcaApi } from '../../../../../api/inventario/marca-api';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { DatosGeneralesStep } from './datos-generales-step';

describe('DatosGeneralesStep: crear producto clasificado', () => {
  const brand = { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null };
  const category = { id: 'c1', nombre: 'Herramientas', activo: true, descripcion: null };
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideTanStackQuery(client),
      { provide: ProductoApi, useValue: { listUnidades: vi.fn().mockResolvedValue([{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]) } },
      { provide: MarcaApi, useValue: { list: vi.fn().mockResolvedValue({ items: [brand], page: 1, limit: 20, totalItems: 1 }) } },
      { provide: CategoriaApi, useValue: { list: vi.fn().mockResolvedValue({ items: [category], page: 1, limit: 20, totalItems: 1 }) } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('exige marca y categoría activas antes de emitir el DTO y permite crear sin fotos', async () => {
    const fixture = TestBed.createComponent(DatosGeneralesStep);
    fixture.detectChanges();
    const form = fixture.componentInstance;
    const create = vi.fn();
    form.create.subscribe(create);
    await vi.waitFor(() => expect(form.loadingUnidades()).toBe(false));
    form.model.update((value) => ({ ...value, nombre: 'Martillo', unidadBaseId: 'u1' }));
    await form.save(new Event('submit'));
    expect(create).not.toHaveBeenCalled();
    expect(form.relationsError()).toContain('marca');
    form.setBrand([brand]);
    await form.save(new Event('submit'));
    expect(create).not.toHaveBeenCalled();
    form.setCategories([category]);
    await form.save(new Event('submit'));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Martillo', marcaId: 'm1', categoriasIds: ['c1'], imagenes: [],
    }));
  });
});
