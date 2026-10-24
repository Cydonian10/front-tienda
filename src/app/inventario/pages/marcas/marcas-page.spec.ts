import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { MarcaApi } from '../../../api/inventario/marca-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { AuthStore } from '../../../store/auth/auth.store';
import MarcasPage from './marcas-page';

describe('MarcasPage', () => {
  const brand = { id: 'm1', nombre: 'Atlas', imagenId: null, activo: true };
  const list = vi.fn();
  const getImage = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const changeStatus = vi.fn();
  const confirm = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    list.mockResolvedValue({ items: [brand], page: 1, limit: 20, totalItems: 21 });
    confirm.mockReturnValue(of(true));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideTanStackQuery(client),
      { provide: MarcaApi, useValue: { list, getImage, create, update, changeStatus } },
      { provide: ConfirmDialogService, useValue: { confirm } },
      { provide: ToastService, useValue: { success: vi.fn() } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  function grant(edit = false): void {
    TestBed.inject(AuthStore).setProfile({ isSuperAdmin: false, permissions: [
      { systemCode: 'INVENTARIO', code: PERMISSION_CODES.PRODUCTS_READ },
      ...(edit ? [{ systemCode: 'INVENTARIO', code: PERMISSION_CODES.PRODUCTS_UPDATE }] : []),
    ] } as never);
  }

  it('lista, busca y filtra con paginación; lectura no permite mutaciones ni imágenes inexistentes', async () => {
    grant();
    const fixture = TestBed.createComponent(MarcasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.query.data()?.items).toEqual([brand]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin imagen');
    expect(fixture.nativeElement.querySelector('[aria-label="Editar Atlas"]')).toBeNull();
    const page = fixture.componentInstance;
    await page.openCreate();
    await page.openEdit(brand);
    await page.save({ nombre: 'Nueva' });
    await page.toggleStatus(brand);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(changeStatus).not.toHaveBeenCalled();
    expect(getImage).not.toHaveBeenCalled();
    page.searchBrands('at');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'at', activo: undefined, page: 1, limit: 20 }));
    page.changeStatus('inactivos');
    page.page.set(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'at', activo: false, page: 2, limit: 20 }));
    page.clearFilters();
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ activo: undefined, page: 1, limit: 20 }));
  });

  it('distingue catálogo vacío, filtros sin resultados y fallo con reintento', async () => {
    grant();
    list.mockResolvedValueOnce({ items: [], page: 1, limit: 20, totalItems: 0 });
    const fixture = TestBed.createComponent(MarcasPage);
    await vi.waitFor(() => expect(fixture.componentInstance.query.data()).toBeDefined());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay marcas');
    list.mockResolvedValue({ items: [], page: 1, limit: 20, totalItems: 0 });
    fixture.componentInstance.searchBrands('sin coincidencias');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay marcas que coincidan');
    });
    list.mockRejectedValueOnce(new Error('Sin red'));
    fixture.componentInstance.searchBrands('otra búsqueda');
    await vi.waitFor(() => expect(fixture.componentInstance.query.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    list.mockResolvedValue({ items: [brand], page: 1, limit: 20, totalItems: 1 });
    await fixture.componentInstance.query.refetch();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Atlas');
    });
  });

  it('sube, reemplaza y quita imagen; valida archivos y libera las vistas previas', async () => {
    grant(true);
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createUrl = vi.fn(() => 'blob:marca');
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeUrl });
    try {
      const fixture = TestBed.createComponent(MarcasPage);
      const page = fixture.componentInstance;
      await vi.waitFor(() => expect(page.query.data()).toBeDefined());
      await page.openCreate();
      fixture.detectChanges();
      const form = page.form()!;
      form.name.set('Atlas');
      const input = document.createElement('input');
      const file = new File(['foto'], 'marca.png', { type: 'image/png' });
      Object.defineProperty(input, 'files', { configurable: true, value: [new File(['x'], 'mal.txt', { type: 'text/plain' })] });
      form.chooseImage({ target: input } as unknown as Event);
      expect(form.validation()).toContain('JPEG');
      Object.defineProperty(input, 'files', { configurable: true, value: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'enorme.png', { type: 'image/png' })] });
      form.chooseImage({ target: input } as unknown as Event);
      expect(form.validation()).toContain('5 MB');
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      form.chooseImage({ target: input } as unknown as Event);
      expect(form.preview()).toBe('blob:marca');
      create.mockResolvedValue(brand);
      await page.save({ nombre: 'Atlas', imagen: file });
      expect(create).toHaveBeenCalledWith({ nombre: 'Atlas', imagen: file });
      fixture.detectChanges();
      expect(revokeUrl).toHaveBeenCalledWith('blob:marca');

      const withImage = { ...brand, imagenId: 'i1' };
      await page.openEdit(withImage);
      fixture.detectChanges();
      page.form()!.name.set('Atlas 2');
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      page.form()!.chooseImage({ target: input } as unknown as Event);
      update.mockResolvedValueOnce({ ...withImage, nombre: 'Atlas 2', imagenId: 'i2' });
      await page.save({ nombre: 'Atlas 2', imagen: file });
      expect(update).toHaveBeenCalledWith('m1', { nombre: 'Atlas 2', imagen: file });
      fixture.detectChanges();

      await page.openEdit({ ...withImage, nombre: 'Atlas 2', imagenId: 'i2' });
      fixture.detectChanges();
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      page.form()!.chooseImage({ target: input } as unknown as Event);
      page.form()!.remove();
      expect(page.form()!.removeImage()).toBe(true);
      expect(revokeUrl).toHaveBeenCalledWith('blob:marca');
      update.mockResolvedValue({ ...withImage, nombre: 'Atlas 2', imagenId: null });
      await page.save({ quitarImagen: true });
      expect(update).toHaveBeenCalledWith('m1', { quitarImagen: true });
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
    }
  });

  it('conserva el formulario tras error y confirma descarte o salida', async () => {
    grant(true);
    const fixture = TestBed.createComponent(MarcasPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.data()).toBeDefined());
    await page.openEdit(brand);
    fixture.detectChanges();
    page.form()!.name.set('Duplicada');
    update.mockRejectedValue({ error: { message: 'Nombre duplicado' } });
    await page.save({ nombre: 'Duplicada' });
    expect(page.formError()).toBe('Nombre duplicado');
    expect(page.form()?.name()).toBe('Duplicada');
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    await page.closeForm();
    expect(page.form()).toBeDefined();
    expect(await new Promise<boolean>((resolve) => page.canLeave().subscribe(resolve))).toBe(false);
    await page.closeForm();
    fixture.detectChanges();
    expect(page.form()).toBeUndefined();
    changeStatus.mockResolvedValue({ ...brand, activo: false });
    await page.toggleStatus(brand);
    expect(changeStatus).toHaveBeenCalledWith('m1', false);
  });

  it('no guarda imágenes ni cambia estado si se revoca PRODUCTOS_EDITAR con el formulario abierto', async () => {
    grant(true);
    const fixture = TestBed.createComponent(MarcasPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.data()).toBeDefined());
    await page.openEdit(brand);
    fixture.detectChanges();
    page.form()!.name.set('Pendiente');
    grant();
    fixture.detectChanges();
    const file = new File(['nueva'], 'nueva.png', { type: 'image/png' });
    await page.save({ nombre: 'Pendiente', imagen: file });
    await page.toggleStatus(brand);
    await page.openCreate();
    expect(update).not.toHaveBeenCalled();
    expect(changeStatus).not.toHaveBeenCalled();
    expect(page.form()?.name()).toBe('Pendiente');
  });
});
