import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject, of } from 'rxjs';
import { ProductoApi } from '../../../api/inventario/product-api';
import { MarcaApi } from '../../../api/inventario/marca-api';
import { CategoriaApi } from '../../../api/inventario/categoria-api';
import { VarianteApi } from '../../../api/inventario/variante-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { ProductResponse } from '../../../api/interfaces/inventario/producto.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { AuthStore } from '../../../store/auth/auth.store';
import { variantesQueryKey } from '../../actions/use-variante-action';
import GestionProductosPage from './gestion-productos-page';

describe('GestionProductosPage', () => {
  const productId = 'b020d35c-3d9e-4e2e-9798-c96033ef1015';
  const search = vi.fn();
  const getById = vi.fn();
  const getImage = vi.fn();
  const listAttributes = vi.fn();
  const listVariants = vi.fn();
  const listVariantImages = vi.fn();
  const createVariant = vi.fn();
  const updateVariant = vi.fn();
  const update = vi.fn();
  const listBrands = vi.fn();
  const listCategories = vi.fn();
  const confirm = vi.fn();
  const params = new BehaviorSubject(convertToParamMap({}));
  const navigate = vi.fn().mockImplementation(async (_, options) => {
    params.next(convertToParamMap(options.queryParams.productoId
      ? { productoId: options.queryParams.productoId }
      : {}));
    return true;
  });
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    navigate.mockImplementation(async (_, options) => {
      params.next(convertToParamMap(options.queryParams.productoId
        ? { productoId: options.queryParams.productoId }
        : {}));
      return true;
    });
    listAttributes.mockResolvedValue([]);
    listVariants.mockResolvedValue([]);
    listVariantImages.mockResolvedValue([]);
    listBrands.mockResolvedValue({ items: [
      { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
      { id: 'm2', nombre: 'Norte', activo: true, imagenId: null },
    ], page: 1, limit: 20, totalItems: 2 });
    listCategories.mockResolvedValue({ items: [
      { id: 'c1', nombre: 'Herramientas', activo: true },
      { id: 'c2', nombre: 'Jardín', activo: true },
    ], page: 1, limit: 20, totalItems: 2 });
    params.next(convertToParamMap({}));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: params.value }, queryParamMap: params } },
        { provide: ProductoApi, useValue: {
          search, getById, listAttributes,
          listUnidades: vi.fn().mockResolvedValue([{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]),
          getImage, update,
        } },
        { provide: MarcaApi, useValue: { list: listBrands } },
        { provide: CategoriaApi, useValue: { list: listCategories } },
        { provide: VarianteApi, useValue: {
          list: listVariants, listImages: listVariantImages,
          create: createVariant, update: updateVariant, getImage: vi.fn(),
        } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  function grantEdit(): void {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [
      { code: PERMISSION_CODES.PRODUCTS_UPDATE, systemCode: 'INVENTARIO' },
    ] } as never);
  }

  async function openProduct(locked = false, relations: Partial<Pick<ProductResponse, 'marca' | 'categorias'>> = {}) {
    params.next(convertToParamMap({ productoId: productId }));
    const product = {
      id: productId, nombre: 'Martillo', descripcion: 'Acero', activo: true,
      unidadBaseId: 'u1', imagenes: [], puedeCambiarUnidadBase: !locked,
      marca: { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
      categorias: [{ id: 'c1', nombre: 'Herramientas', activo: true }],
      ...relations,
    };
    getById.mockResolvedValue(product);
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.productQuery.data()).toEqual(product));
    fixture.detectChanges();
    return { fixture, product };
  }

  it('abre sin selección ni petición y oculta la creación a usuarios de consulta', () => {
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Selecciona un producto');
    expect(fixture.nativeElement.querySelector('a[href="/admin/inventario/productos"]')).toBeNull();
    expect(getById).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it('abre un enlace con UUID y muestra el detalle cargado', async () => {
    params.next(convertToParamMap({ productoId: productId }));
    getById.mockResolvedValue({
      id: productId, nombre: 'Martillo', descripcion: null, activo: false,
      unidadBaseId: 'u1', imagenes: [], puedeCambiarUnidadBase: true,
      marca: { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
      categorias: [{ id: 'c1', nombre: 'Herramientas', activo: true }],
    });
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

  it('permite consultar sin editar y comprueba permiso incluso al invocar el guardado directamente', async () => {
    const { fixture, product } = await openProduct();
    const page = fixture.componentInstance;
    expect(page.permissions.edit()).toBe(false);
    expect(fixture.nativeElement.querySelector('datos-generales-step button')).toBeNull();
    await page.saveProduct({ nombre: 'Cambiado', descripcion: '', unidadBaseId: 'u1', activo: true });
    expect(update).not.toHaveBeenCalled();

    grantEdit();
    fixture.detectChanges();
    expect(page.permissions.edit()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Editar');
    page.generalData()?.startEdit();
    page.generalData()?.model.update((value) => ({ ...value, nombre: 'Martillo nuevo' }));
    expect(page.hasUnsavedChanges()).toBe(true);
    update.mockResolvedValue({ ...product, nombre: 'Martillo nuevo' });
    await page.saveProduct({ nombre: 'Martillo nuevo', descripcion: 'Acero', unidadBaseId: 'u1', activo: true });
    fixture.detectChanges();
    expect(update).toHaveBeenCalledOnce();
    expect(page.hasUnsavedChanges()).toBe(false);
  });

  it('deshabilita la unidad base bloqueada y conserva el borrador ante error de API', async () => {
    grantEdit();
    const { fixture } = await openProduct(true);
    const page = fixture.componentInstance;
    expect((fixture.nativeElement.querySelector('#product-base-unit') as HTMLSelectElement).disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('saldos o movimientos');

    page.generalData()?.startEdit();
    page.generalData()?.model.update((value) => ({ ...value, nombre: 'Martillo nuevo' }));
    const dto = { nombre: 'Martillo nuevo', descripcion: 'Acero', unidadBaseId: 'u1', activo: true };
    update.mockRejectedValue(new HttpErrorResponse({
      status: 409, error: { message: 'El nombre ya está en uso' },
    }));
    await page.saveProduct(dto);
    await vi.waitFor(() => expect(page.updateMutation.isError()).toBe(true));
    fixture.detectChanges();
    expect(page.hasUnsavedChanges()).toBe(true);
    expect(page.generalData()?.model().nombre).toBe('Martillo nuevo');
    expect(fixture.nativeElement.textContent).toContain('El nombre ya está en uso');

    await page.saveProduct({ ...dto, unidadBaseId: 'u2' });
    expect(update).toHaveBeenCalledOnce();
  });

  it('confirma antes de descartar, conserva la edición si se cancela y limpia al aceptar', async () => {
    grantEdit();
    const { fixture } = await openProduct();
    const page = fixture.componentInstance;
    page.generalData()?.startEdit();
    page.generalData()?.model.update((value) => ({ ...value, nombre: 'Pendiente' }));
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));

    await page.discardEdit();
    expect(page.hasUnsavedChanges()).toBe(true);
    await page.discardEdit();
    expect(page.hasUnsavedChanges()).toBe(false);
    expect(page.generalData()?.model().nombre).toBe('Martillo');
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('envía el formulario de gestión aunque la unidad base esté bloqueada', async () => {
    grantEdit();
    const { fixture, product } = await openProduct(true);
    const form = fixture.componentInstance.generalData()!;
    form.startEdit();
    form.model.update((value) => ({ ...value, nombre: 'Martillo de acero' }));
    update.mockResolvedValue({ ...product, nombre: 'Martillo de acero' });

    await form.save(new Event('submit'));
    await vi.waitFor(() => expect(update).toHaveBeenCalledWith(productId, expect.objectContaining({
      nombre: 'Martillo de acero', unidadBaseId: 'u1',
    })));
  });

  it('muestra asociaciones inactivas en consulta sin ofrecer cambios ni consultar opciones', async () => {
    const { fixture } = await openProduct(false, {
      marca: { id: 'm1', nombre: 'Atlas', activo: false, imagenId: null },
      categorias: [{ id: 'c1', nombre: 'Herramientas', activo: false }],
    });
    expect(fixture.nativeElement.textContent).toContain('Atlas');
    expect(fixture.nativeElement.textContent).toContain('Herramientas');
    expect(fixture.nativeElement.querySelectorAll('catalogo-producto-selector .badge-warning')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('#search-brand-product')).toBeNull();
    expect(fixture.nativeElement.querySelector('#search-category-product')).toBeNull();
    expect(listBrands).not.toHaveBeenCalled();
    expect(listCategories).not.toHaveBeenCalled();
    const form = fixture.componentInstance.generalData()!;
    form.startEdit();
    form.setBrand([{ id: 'm2', nombre: 'Norte', activo: true }]);
    form.setCategories([{ id: 'c2', nombre: 'Jardín', activo: true }]);
    expect(form.model().marcaId).toBe('m1');
    expect(form.model().categoriasIds).toEqual(['c1']);
  });

  it('guarda otros datos sin reenviar relaciones inactivas y mantiene el estado de lectura al finalizar', async () => {
    grantEdit();
    const { fixture, product } = await openProduct(false, {
      marca: { id: 'm1', nombre: 'Atlas', activo: false, imagenId: null },
      categorias: [{ id: 'c1', nombre: 'Herramientas', activo: false }],
    });
    const page = fixture.componentInstance;
    const form = page.generalData()!;
    form.startEdit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('catalogo-producto-selector .badge-warning')).toHaveLength(2);
    form.model.update((value) => ({ ...value, nombre: 'Martillo reforzado' }));
    expect(page.hasUnsavedChanges()).toBe(true);
    update.mockResolvedValue({ ...product, nombre: 'Martillo reforzado' });
    await form.save(new Event('submit'));
    await vi.waitFor(() => expect(form.editing()).toBe(false));
    const dto = update.mock.calls[0][1];
    expect(dto).toMatchObject({ nombre: 'Martillo reforzado', unidadBaseId: 'u1' });
    expect(dto).not.toHaveProperty('marcaId');
    expect(dto).not.toHaveProperty('categoriasIds');
    fixture.detectChanges();
    expect(page.hasUnsavedChanges()).toBe(false);
    expect(form.editing()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('catalogo-producto-selector .badge-warning')).toHaveLength(2);
  });

  it('explica que no se pueden quitar todas las categorías al editar', async () => {
    grantEdit();
    const { fixture } = await openProduct();
    const form = fixture.componentInstance.generalData()!;
    form.startEdit();
    form.setCategories([]);
    await form.save(new Event('submit'));
    fixture.detectChanges();
    expect(form.relationsError()).toContain('al menos una categoría');
    expect(fixture.nativeElement.querySelector('[aria-label="Clasificación del producto"] [role="alert"]')?.textContent)
      .toContain('al menos una categoría');
    expect(update).not.toHaveBeenCalled();
  });

  it('guarda cambios de marca y categorías junto a los otros datos generales', async () => {
    grantEdit();
    const { fixture, product } = await openProduct();
    const page = fixture.componentInstance;
    const form = page.generalData()!;
    form.startEdit();
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(listBrands).toHaveBeenCalledWith({ activo: true, page: 1, limit: 20 });
      expect(listCategories).toHaveBeenCalledWith({ activo: true, page: 1, limit: 20 });
    });
    const newBrand = { id: 'm2', nombre: 'Norte', activo: true, imagenId: null };
    const newCategory = { id: 'c2', nombre: 'Jardín', activo: true };
    form.setBrand([newBrand]);
    form.setCategories([...product.categorias, newCategory]);
    form.model.update((value) => ({ ...value, nombre: 'Martillo nuevo' }));
    expect(page.hasUnsavedChanges()).toBe(true);
    const updated = { ...product, nombre: 'Martillo nuevo', marca: newBrand, categorias: [...product.categorias, newCategory] };
    getById.mockResolvedValue(updated);
    update.mockResolvedValue(updated);
    await form.save(new Event('submit'));
    await vi.waitFor(() => expect(form.editing()).toBe(false));
    expect(update).toHaveBeenCalledWith(productId, expect.objectContaining({
      nombre: 'Martillo nuevo', marcaId: 'm2', categoriasIds: ['c1', 'c2'],
    }));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(page.productQuery.data()?.marca.nombre).toBe('Norte');
      expect(form.brandSelected()[0].nombre).toBe('Norte');
      expect(page.hasUnsavedChanges()).toBe(false);
    });
  });

  it('permite mantener categorías inactivas existentes al agregar otra y no marca un mero reordenamiento', async () => {
    grantEdit();
    const originalCategories = [
      { id: 'c1', nombre: 'Herramientas', activo: false },
      { id: 'c2', nombre: 'Jardín', activo: true },
    ];
    const { fixture, product } = await openProduct(false, { categorias: originalCategories });
    const form = fixture.componentInstance.generalData()!;
    form.startEdit();
    form.setCategories([...originalCategories].reverse());
    expect(form.dirty()).toBe(false);
    const extra = { id: 'c3', nombre: 'Pinturas', activo: true };
    form.setCategories([...originalCategories, extra]);
    expect(form.dirty()).toBe(true);
    update.mockResolvedValue({ ...product, categorias: [...originalCategories, extra] });
    await form.save(new Event('submit'));
    await vi.waitFor(() => expect(update).toHaveBeenCalledWith(productId, expect.objectContaining({
      categoriasIds: ['c1', 'c2', 'c3'],
    })));
    expect(update.mock.calls[0][1]).not.toHaveProperty('marcaId');
  });

  it('incluye solo asociaciones cambiadas en el mismo guardado que las fotos', async () => {
    const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:foto-nueva') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    try {
      grantEdit();
      const { fixture, product } = await openProduct(false, {
        marca: { id: 'm1', nombre: 'Atlas', activo: false, imagenId: null },
      });
      const form = fixture.componentInstance.generalData()!;
      form.startEdit();
      form.setCategories([...product.categorias, { id: 'c2', nombre: 'Jardín', activo: true }]);
      const file = new File(['nueva'], 'nueva.png', { type: 'image/png' });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      form.addImages({ target: input } as unknown as Event);
      update.mockResolvedValue({ ...product, categorias: form.categoriesSelected() });

      await form.save(new Event('submit'));
      await vi.waitFor(() => expect(update).toHaveBeenCalledOnce());
      expect(update.mock.calls[0][1]).toMatchObject({
        categoriasIds: ['c1', 'c2'], imagenesConservarIds: [], imagenes: [file],
      });
      expect(update.mock.calls[0][1]).not.toHaveProperty('marcaId');
      await vi.waitFor(() => expect(form.editing()).toBe(false));
    } finally {
      if (originalCreate) Object.defineProperty(URL, 'createObjectURL', originalCreate);
      else delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
      if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', originalRevoke);
      else delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
    }
  });

  it('conserva asociaciones elegidas tras error, confirma descarte y permite reintentar', async () => {
    grantEdit();
    const { fixture, product } = await openProduct();
    const page = fixture.componentInstance;
    const form = page.generalData()!;
    const newBrand = { id: 'm2', nombre: 'Norte', activo: true, imagenId: null };
    form.startEdit();
    form.setBrand([newBrand]);
    getById.mockResolvedValue({ ...product, marca: newBrand });
    update.mockRejectedValueOnce(new HttpErrorResponse({
      status: 400, error: { message: 'La marca está inactiva' },
    })).mockResolvedValueOnce({ ...product, marca: newBrand });
    await form.save(new Event('submit'));
    await vi.waitFor(() => expect(page.updateMutation.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La marca está inactiva');
    expect(form.brandSelected()).toEqual([newBrand]);
    expect(page.hasUnsavedChanges()).toBe(true);
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    await page.discardEdit();
    expect(form.brandSelected()).toEqual([newBrand]);
    expect(page.hasUnsavedChanges()).toBe(true);
    await form.save(new Event('submit'));
    await vi.waitFor(() => expect(form.editing()).toBe(false));
    expect(update).toHaveBeenCalledTimes(2);
    fixture.detectChanges();
    expect(page.hasUnsavedChanges()).toBe(false);
    form.startEdit();
    form.setBrand([product.marca]);
    await page.discardEdit();
    expect(form.brandSelected()).toEqual([newBrand]);
    expect(page.hasUnsavedChanges()).toBe(false);
  });

  it('impide guardar o cambiar asociaciones si se revoca el permiso durante la edición', async () => {
    grantEdit();
    const { fixture } = await openProduct();
    const page = fixture.componentInstance;
    const form = page.generalData()!;
    form.startEdit();
    form.setBrand([{ id: 'm2', nombre: 'Norte', activo: true }]);
    expect(page.hasUnsavedChanges()).toBe(true);
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [
      { code: PERMISSION_CODES.PRODUCTS_READ, systemCode: 'INVENTARIO' },
    ] } as never);
    fixture.detectChanges();
    form.setCategories([{ id: 'c2', nombre: 'Jardín', activo: true }]);
    expect(form.model().categoriasIds).toEqual(['c1']);
    await form.save(new Event('submit'));
    await page.saveProduct({ nombre: 'Cambio indebido', descripcion: 'Acero', unidadBaseId: 'u1', activo: true, marcaId: 'm2' });
    expect(update).not.toHaveBeenCalled();
    expect(form.brandSelected()[0].id).toBe('m2');
    expect(page.hasUnsavedChanges()).toBe(true);
  });

  it('mantiene las fotos pendientes tras un rechazo y envía las asociaciones conservadas', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:foto') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    try {
      grantEdit();
      params.next(convertToParamMap({ productoId: productId }));
      const product = {
        id: productId, nombre: 'Martillo', descripcion: null, activo: true,
        unidadBaseId: 'u1', puedeCambiarUnidadBase: true,
        imagenes: [{ id: 'as1', imagenId: 'i1', orden: 0, esPrincipal: true }],
        marca: { id: 'm1', nombre: 'Atlas', activo: true, imagenId: null },
        categorias: [{ id: 'c1', nombre: 'Herramientas', activo: true }],
      };
      getById.mockResolvedValue(product);
      getImage.mockResolvedValue(new Blob(['guardada']));
      const fixture = TestBed.createComponent(GestionProductosPage);
      fixture.detectChanges();
      await vi.waitFor(() => expect(fixture.componentInstance.generalData()).toBeDefined());
      const form = fixture.componentInstance.generalData()!;
      form.startEdit();
      form.removeSavedImage('as1');
      const file = new File(['nueva'], 'nueva.png', { type: 'image/png' });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file] });
      form.addImages({ target: input } as unknown as Event);
      expect(form.totalImages()).toBe(1);
      update.mockRejectedValue(new HttpErrorResponse({ status: 409 }));

      await form.save(new Event('submit'));
      await vi.waitFor(() => expect(update).toHaveBeenCalledWith(productId, expect.objectContaining({
        imagenesConservarIds: [], imagenes: [file],
      })));
      expect(update.mock.calls[0][1]).not.toHaveProperty('marcaId');
      expect(update.mock.calls[0][1]).not.toHaveProperty('categoriasIds');
      expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
      expect(form.images()).toHaveLength(1);
    } finally {
      if (originalCreate) Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
      else delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
      if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
      else delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
    }
  });

  it('muestra variantes existentes y solo permite añadirlas con permiso de edición', async () => {
    listAttributes.mockResolvedValue([{ atributoId: 'a1', atributo: 'Color', productoId: productId }]);
    listVariants.mockResolvedValue([{
      id: 'v1', productoId: productId, sku: 'SKU-1', precio: '10.00', codigoBarras: null,
      activo: true, valores: [{ atributoId: 'a1', valor: 'Negro' }], imagenes: [],
    }]);
    const { fixture } = await openProduct();
    await vi.waitFor(() => expect(fixture.componentInstance.variantsQuery.isSuccess()).toBe(true));
    await vi.waitFor(() => expect(fixture.componentInstance.attributesQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SKU-1');
    expect(fixture.nativeElement.querySelector('button[aria-label="Quitar foto propia 1"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('variante-form')).toBeNull();
    fixture.componentInstance.openNewVariant();
    await fixture.componentInstance.createVariant({ precio: '20.00', valores: [], imagenes: [] });
    expect(createVariant).not.toHaveBeenCalled();

    grantEdit();
    fixture.componentInstance.openNewVariant();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('variante-form')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('SKU (opcional)');
  });

  it('da de alta con los atributos existentes e invalida solo el listado de este producto', async () => {
    grantEdit();
    listAttributes.mockResolvedValue([{ atributoId: 'a1', atributo: 'Color', productoId: productId }]);
    client.setQueryData(variantesQueryKey('otro-producto'), []);
    listVariants.mockResolvedValueOnce([]).mockResolvedValue([{
      id: 'v2', productoId: productId, sku: 'SKU-2', precio: '20.00', codigoBarras: null,
      activo: true, valores: [{ atributoId: 'a1', valor: 'Rojo' }], imagenes: [],
    }]);
    const { fixture } = await openProduct();
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.attributesQuery.isSuccess()).toBe(true));
    page.openNewVariant();
    fixture.detectChanges();
    const form = page.variantForm()!;
    form.model.set({ sku: 'SKU-2', precio: '20.00', codigoBarras: '', valores: { a1: 'Rojo' } });
    expect(page.hasUnsavedChanges()).toBe(true);
    const dto = {
      sku: 'SKU-2', precio: '20.00', codigoBarras: undefined,
      valores: [{ atributoId: 'a1', valor: 'Rojo' }], imagenes: [],
    };
    createVariant.mockResolvedValue({
      id: 'v2', productoId: productId, sku: 'SKU-2', precio: '20.00', codigoBarras: null,
      activo: true, valores: dto.valores, imagenes: [],
    });
    await page.createVariant(dto);
    expect(createVariant).toHaveBeenCalledWith(productId, dto);
    expect(page.newVariantOpen()).toBe(false);
    expect(page.hasUnsavedChanges()).toBe(false);
    await vi.waitFor(() => expect(page.variantsQuery.data()?.some((variant) => variant.id === 'v2')).toBe(true));
    expect(client.getQueryState(variantesQueryKey('otro-producto'))?.isInvalidated).toBe(false);
  });

  it('incluye formularios de variantes pendientes en la confirmación de salida', async () => {
    grantEdit();
    listAttributes.mockResolvedValue([{ atributoId: 'a1', atributo: 'Color', productoId: productId }]);
    const { fixture } = await openProduct();
    await vi.waitFor(() => expect(fixture.componentInstance.attributesQuery.isSuccess()).toBe(true));
    fixture.componentInstance.openNewVariant();
    fixture.detectChanges();
    fixture.componentInstance.variantForm()?.model.update((value) => ({ ...value, precio: '9.90' }));
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    await fixture.componentInstance.cancelNewVariant();
    expect(fixture.componentInstance.newVariantOpen()).toBe(true);
    await fixture.componentInstance.cancelNewVariant();
    expect(fixture.componentInstance.newVariantOpen()).toBe(false);
  });

  it('no pierde el borrador al fallar el alta y bloquea el manejador si se revoca el permiso', async () => {
    grantEdit();
    listAttributes.mockResolvedValue([{ atributoId: 'a1', atributo: 'Color', productoId: productId }]);
    const { fixture } = await openProduct();
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.attributesQuery.isSuccess()).toBe(true));
    page.openNewVariant();
    fixture.detectChanges();
    page.variantForm()!.model.set({
      sku: 'SKU-3', precio: '15.00', codigoBarras: '', valores: { a1: 'Azul' },
    });
    const dto = {
      sku: 'SKU-3', precio: '15.00', valores: [{ atributoId: 'a1', valor: 'Azul' }], imagenes: [],
    };
    createVariant.mockRejectedValue(new HttpErrorResponse({ status: 409 }));
    await page.createVariant(dto);
    expect(page.newVariantOpen()).toBe(true);
    expect(page.variantForm()?.model().precio).toBe('15.00');
    expect(page.hasUnsavedChanges()).toBe(true);

    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [] } as never);
    fixture.detectChanges();
    await page.createVariant(dto);
    expect(createVariant).toHaveBeenCalledOnce();
    expect(page.variantForm()?.model().precio).toBe('15.00');
  });

  it('incluye la tarjeta de una variante modificada entre los cambios sin guardar', async () => {
    listVariants.mockResolvedValue([{
      id: 'v1', productoId: productId, sku: 'SKU-1', precio: '10.00', codigoBarras: null,
      activo: true, valores: [], imagenes: [],
    }]);
    const { fixture } = await openProduct();
    await vi.waitFor(() => expect(fixture.componentInstance.variantsQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    const card = fixture.componentInstance.variantCards()[0];
    card.setPrice({ target: { value: '11.00' } } as unknown as Event);
    expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
  });

  it('mueve el foco al formulario nuevo y lo devuelve al botón al cancelar', async () => {
    grantEdit();
    listAttributes.mockResolvedValue([{ atributoId: 'a1', atributo: 'Color', productoId: productId }]);
    const { fixture } = await openProduct();
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.attributesQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    const trigger = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.includes('Añadir variante'),
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('variante-form input[type="text"]'));

    await page.cancelNewVariant();
    fixture.detectChanges();
    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.includes('Añadir variante'),
    );
    expect(document.activeElement).toBe(addButton);
  });
});
