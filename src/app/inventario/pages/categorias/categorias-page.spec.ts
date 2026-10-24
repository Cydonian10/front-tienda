import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { CategoriaApi } from '../../../api/inventario/categoria-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { AuthStore } from '../../../store/auth/auth.store';
import CategoriasPage from './categorias-page';

describe('CategoriasPage', () => {
  const categoria = { id: 'c1', nombre: 'Herramientas', descripcion: 'Manual', activo: true };
  const list = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const changeStatus = vi.fn();
  const confirm = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    list.mockResolvedValue({ items: [categoria], page: 1, limit: 20, totalItems: 21 });
    confirm.mockReturnValue(of(true));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideTanStackQuery(client),
      { provide: CategoriaApi, useValue: { list, create, update, changeStatus } },
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

  it('consulta, busca y pagina desde la API, manteniendo lectura sin acciones de escritura', async () => {
    grant();
    const fixture = TestBed.createComponent(CategoriasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.query.data()?.items).toEqual([categoria]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Herramientas');
    expect(fixture.nativeElement.textContent).toContain('Manual');
    expect(fixture.nativeElement.querySelector('[aria-label="Editar Herramientas"]')).toBeNull();
    await fixture.componentInstance.openCreate();
    await fixture.componentInstance.openEdit(categoria);
    await fixture.componentInstance.save({ nombre: 'Nueva', descripcion: null });
    await fixture.componentInstance.toggleStatus(categoria);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(changeStatus).not.toHaveBeenCalled();
    fixture.componentInstance.searchCategories('he');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'he', activo: undefined, page: 1, limit: 20 }));
    fixture.componentInstance.changeStatus('inactivos');
    fixture.componentInstance.page.set(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ q: 'he', activo: false, page: 2, limit: 20 }));
    fixture.componentInstance.clearFilters();
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith({ activo: undefined, page: 1, limit: 20 }));
  });

  it('diferencia sin registros, sin resultados y error con reintento', async () => {
    grant();
    list.mockResolvedValueOnce({ items: [], page: 1, limit: 20, totalItems: 0 });
    const fixture = TestBed.createComponent(CategoriasPage);
    await vi.waitFor(() => expect(fixture.componentInstance.query.data()).toBeDefined());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay categorías');
    list.mockResolvedValue({ items: [], page: 1, limit: 20, totalItems: 0 });
    fixture.componentInstance.searchCategories('sin coincidencias');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay categorías que coincidan');
    });
    list.mockRejectedValueOnce(new Error('Sin red'));
    fixture.componentInstance.searchCategories('otra búsqueda');
    await vi.waitFor(() => expect(fixture.componentInstance.query.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    list.mockResolvedValue({ items: [categoria], page: 1, limit: 20, totalItems: 1 });
    await fixture.componentInstance.query.refetch();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Herramientas');
    });
  });

  it('valida y guarda descripción nullable; conserva datos ante fallo y confirma descarte', async () => {
    grant(true);
    const fixture = TestBed.createComponent(CategoriasPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.data()).toBeDefined());
    await page.openEdit(categoria);
    fixture.detectChanges();
    const form = page.form()!;
    form.name.set('  Herramientas nuevas  ');
    form.description.set('');
    update.mockRejectedValueOnce({ error: { message: 'Nombre duplicado' } });
    form.save(new Event('submit'));
    await vi.waitFor(() => expect(page.formError()).toBe('Nombre duplicado'));
    expect(page.formError()).toBe('Nombre duplicado');
    expect(page.form()?.name()).toBe('  Herramientas nuevas  ');
    expect(update).toHaveBeenCalledWith('c1', { nombre: 'Herramientas nuevas', descripcion: null });
    confirm.mockReturnValueOnce(of(false)).mockReturnValueOnce(of(false)).mockReturnValueOnce(of(true));
    await page.closeForm();
    expect(page.form()).toBeDefined();
    expect(await new Promise<boolean>((resolve) => page.canLeave().subscribe(resolve))).toBe(false);
    await page.closeForm();
    fixture.detectChanges();
    expect(page.form()).toBeUndefined();
  });

  it('crea, cambia estado y distingue operaciones con permiso de edición', async () => {
    grant(true);
    const fixture = TestBed.createComponent(CategoriasPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.data()).toBeDefined());
    await page.openCreate();
    fixture.detectChanges();
    page.form()!.name.set('  ');
    page.form()!.save(new Event('submit'));
    expect(page.form()!.validation()).toContain('1 y 200');
    page.form()!.name.set('A'.repeat(201));
    page.form()!.save(new Event('submit'));
    expect(page.form()!.validation()).toContain('1 y 200');
    expect(create).not.toHaveBeenCalled();
    create.mockResolvedValue(categoria);
    await page.save({ nombre: 'Herramientas', descripcion: null });
    expect(create).toHaveBeenCalledWith({ nombre: 'Herramientas', descripcion: null });
    changeStatus.mockResolvedValue({ ...categoria, activo: false });
    await page.toggleStatus(categoria);
    expect(changeStatus).toHaveBeenCalledWith('c1', false);
  });

  it('no ejecuta mutaciones si se revoca PRODUCTOS_EDITAR con cambios pendientes', async () => {
    grant(true);
    const fixture = TestBed.createComponent(CategoriasPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.query.data()).toBeDefined());
    await page.openEdit(categoria);
    fixture.detectChanges();
    page.form()!.name.set('Pendiente');
    grant();
    fixture.detectChanges();
    await page.save({ nombre: 'Pendiente', descripcion: null });
    await page.toggleStatus(categoria);
    await page.openCreate();
    expect(update).not.toHaveBeenCalled();
    expect(changeStatus).not.toHaveBeenCalled();
    expect(page.form()?.name()).toBe('Pendiente');
  });
});
