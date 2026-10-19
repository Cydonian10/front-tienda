import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { BehaviorSubject, of } from 'rxjs';
import { ProductoApi } from '../../../api/inventario/product-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { AuthStore } from '../../../store/auth/auth.store';
import GestionProductosPage from './gestion-productos-page';

describe('GestionProductosPage', () => {
  const productId = 'b020d35c-3d9e-4e2e-9798-c96033ef1015';
  const search = vi.fn();
  const getById = vi.fn();
  const getImage = vi.fn();
  const update = vi.fn();
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
    vi.clearAllMocks();
    params.next(convertToParamMap({}));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: params.value }, queryParamMap: params } },
        { provide: ProductoApi, useValue: {
          search, getById, listUnidades: vi.fn().mockResolvedValue([{ id: 'u1', nombre: 'Unidad', simbolo: 'u' }]),
          getImage, update,
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

  async function openProduct(locked = false) {
    params.next(convertToParamMap({ productoId: productId }));
    const product = {
      id: productId, nombre: 'Martillo', descripcion: 'Acero', activo: true,
      unidadBaseId: 'u1', imagenes: [], puedeCambiarUnidadBase: !locked,
    };
    getById.mockResolvedValue(product);
    const fixture = TestBed.createComponent(GestionProductosPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.productQuery.data()).toEqual(product));
    fixture.detectChanges();
    return { fixture, product };
  }

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
    getById.mockResolvedValue({
      id: productId, nombre: 'Martillo', descripcion: null, activo: false,
      unidadBaseId: 'u1', imagenes: [], puedeCambiarUnidadBase: true,
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
      expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
      expect(form.images()).toHaveLength(1);
    } finally {
      if (originalCreate) Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
      else delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
      if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
      else delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
    }
  });
});
