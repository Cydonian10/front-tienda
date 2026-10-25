import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { ProveedorApi } from '../../../api/inventario/proveedor-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthProfileService } from '../../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { AuthStore } from '../../../store/auth/auth.store';
import { ToastService } from '../../../shared/services/toast/toast.service';
import routes from '../../inventario.routes';
import ProveedoresPage from './proveedores-page';

@Component({ template: '' })
class EmptyPage {}

describe('listado de proveedores', () => {
  const id = '123e4567-e89b-12d3-a456-426614174000';
  const proveedor = { id, nombre: 'Acero Norte', documento: '204', contacto: null };
  const list = vi.fn();
  const create = vi.fn();
  const success = vi.fn();
  const empty = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  beforeEach(() => {
    vi.resetAllMocks();
    list.mockResolvedValue(empty);
    create.mockResolvedValue({ ...proveedor, documento: null });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: ProveedorApi, useValue: { list, create } },
        { provide: ToastService, useValue: { success } },
        provideRouter([
          { path: 'admin', component: EmptyPage },
          { path: 'auth/login', component: EmptyPage },
          { path: 'admin/inventario', children: routes },
        ]),
        { provide: AuthSessionService, useValue: { get: () => ({ accessToken: 'token' }), clear: vi.fn() } },
        { provide: AuthProfileService, useValue: { load: vi.fn().mockResolvedValue(undefined), clear: vi.fn() } },
      ],
    });
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: [{ code: PERMISSION_CODES.PROVEEDORES_READ, systemCode: 'INVENTARIO' }],
    } as never);
  });

  afterEach(() => TestBed.resetTestingModule());

  function grant(...codes: string[]) {
    TestBed.inject(AuthStore).setProfile({
      isSuperAdmin: false,
      permissions: codes.map((code) => ({ code, systemCode: 'INVENTARIO' })),
    } as never);
  }

  it('presenta proveedores reales en tabla y fichas compactas con enlace al detalle contextual', async () => {
    list.mockResolvedValue({ data: [proveedor], meta: { page: 2, limit: 20, total: 21, totalPages: 2 } });
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/proveedores?nombre=Acero&page=2', ProveedoresPage,
    );
    await vi.waitFor(() => expect(page.query.data()?.data).toEqual([proveedor]));
    expect(list).toHaveBeenCalledWith(2, 20, 'Acero', undefined);
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    expect(root.querySelector('table')?.textContent).toContain('Acero Norte');
    expect(root.querySelector('table')?.textContent).toContain('204');
    expect(root.querySelector('ul[aria-label="Listado de proveedores"]')?.textContent).toContain('Acero Norte');
    expect(root.querySelector('table a')?.getAttribute('href')).toBe(
      `/admin/inventario/proveedores/${id}?listaNombre=Acero&listaPage=2&listaLimit=20`,
    );
    expect(root.querySelector('app-pagination')).not.toBeNull();
  });

  it('busca por nombre y documento, reinicia la página y refleja la paginación en la URL', async () => {
    list.mockImplementation((page: number, limit: number, nombre?: string, documento?: string) =>
      Promise.resolve({ data: [proveedor], meta: { page, limit, total: 40, totalPages: Math.ceil(40 / limit) } }),
    );
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/proveedores?page=2&limit=10', ProveedoresPage,
    );
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 10, undefined, undefined));
    page.nombreDraft.set(' Acero ');
    page.documentoDraft.set(' 204 ');
    page.search(new Event('submit'));
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe(
      '/admin/inventario/proveedores?nombre=Acero&documento=204&limit=10',
    ));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 10, 'Acero', '204'));
    page.changePage(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 10, 'Acero', '204'));
    expect(TestBed.inject(Router).url).toContain('page=2');
    page.changePageSize(20);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, 'Acero', '204'));
    expect(TestBed.inject(Router).url).not.toContain('page=2');
    page.clearSearch();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/inventario/proveedores'));
  });

  it('restaura filtros compartidos en la URL y normaliza página y límite inválidos', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/admin/inventario/proveedores?documento=204&page=no&limit=1000', ProveedoresPage,
    );
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, undefined, '204'));
    expect(page.filters()).toEqual({ nombre: '', documento: '204', page: 1, limit: 20 });
    harness.detectChanges();
    expect((harness.routeNativeElement?.querySelector('#proveedor-documento') as HTMLInputElement).value).toBe('204');
  });

  it('distingue carga, error recuperable, vacío y ausencia de coincidencias', async () => {
    let reject!: (error: Error) => void;
    list.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/admin/inventario/proveedores', ProveedoresPage);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Cargando proveedores');
    reject(new Error('Sin conexión'));
    await vi.waitFor(() => expect(page.query.isError()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No pudimos cargar la información');
    list.mockResolvedValue(empty);
    await page.query.refetch();
    await vi.waitFor(() => expect(page.query.isSuccess()).toBe(true));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Todavía no hay proveedores');

    page.nombreDraft.set('No existe');
    page.search(new Event('submit'));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 20, 'No existe', undefined));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No encontramos resultados');
  });

  it('oculta el alta sin permiso y no permite abrir el diálogo invocando la acción directamente', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/admin/inventario/proveedores', ProveedoresPage);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('header button')).toBeNull();
    page.openCreate();
    expect(page.showCreate()).toBe(false);

    grant(PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.PROVEEDORES_CREATE);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('header button')).not.toBeNull();
    grant(PERMISSION_CODES.PROVEEDORES_READ);
    page.openCreate();
    expect(page.showCreate()).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('valida nombre, conserva campos y muestra conflicto 409 junto al documento', async () => {
    grant(PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.PROVEEDORES_CREATE);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/inventario/proveedores', ProveedoresPage);
    harness.detectChanges();
    (harness.routeNativeElement?.querySelector('header button') as HTMLButtonElement).click();
    harness.detectChanges();
    const dialog = harness.routeNativeElement!.querySelector('app-crear-proveedor-dialog')!;
    const form = dialog.querySelector('form:not(.modal-backdrop)') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
    expect(dialog.textContent).toContain('El nombre es obligatorio');
    expect(create).not.toHaveBeenCalled();

    create.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    // Los controles permanecen montados mientras la mutación devuelve el conflicto.
    const nombre = dialog.querySelector('#crear-proveedor-nombre') as HTMLInputElement;
    const documento = dialog.querySelector('#crear-proveedor-documento') as HTMLInputElement;
    const contacto = dialog.querySelector('#crear-proveedor-contacto') as HTMLInputElement;
    for (const [input, value] of [[nombre, 'Metal Sur'], [documento, '204'], [contacto, 'Correo'] ] as const) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(dialog.textContent).toContain('Este documento ya pertenece a otro proveedor');
    });
    expect(create).toHaveBeenCalledWith({ nombre: 'Metal Sur', documento: '204', contacto: 'Correo' });
    expect(documento.value).toBe('204');
    expect(nombre.value).toBe('Metal Sur');
    expect(contacto.value).toBe('Correo');
    expect(dialog.querySelector('#crear-proveedor-documento')?.getAttribute('aria-invalid')).toBe('true');
    expect(success).not.toHaveBeenCalled();
  });

  it('crea con campos opcionales omitidos, refresca la tabla y cierra restaurando el foco', async () => {
    grant(PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.PROVEEDORES_CREATE);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/admin/inventario/proveedores', ProveedoresPage);
    await vi.waitFor(() => expect(page.query.isSuccess()).toBe(true));
    harness.detectChanges();
    const trigger = harness.routeNativeElement?.querySelector('header button') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    harness.detectChanges();
    const dialog = harness.routeNativeElement!.querySelector('app-crear-proveedor-dialog')!;
    await vi.waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    const nombre = dialog.querySelector('#crear-proveedor-nombre') as HTMLInputElement;
    nombre.value = ' Acero Norte ';
    nombre.dispatchEvent(new Event('input', { bubbles: true }));
    dialog.querySelector('form:not(.modal-backdrop)')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => {
      harness.detectChanges();
      expect(page.showCreate()).toBe(false);
    });
    expect(create).toHaveBeenCalledWith({ nombre: 'Acero Norte' });
    expect(success).toHaveBeenCalledWith('Proveedor Acero Norte registrado.');
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(document.activeElement).toBe(trigger);
  });

  it('cierra con Escape y retorna el foco al disparador sin alterar el listado', async () => {
    grant(PERMISSION_CODES.PROVEEDORES_READ, PERMISSION_CODES.PROVEEDORES_CREATE);
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/admin/inventario/proveedores', ProveedoresPage);
    harness.detectChanges();
    const trigger = harness.routeNativeElement?.querySelector('header button') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    harness.detectChanges();
    const dialog = harness.routeNativeElement!.querySelector('dialog')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    harness.detectChanges();
    expect(page.showCreate()).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(create).not.toHaveBeenCalled();
  });
});
