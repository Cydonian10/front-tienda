import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { AtributoApi } from '../../../api/inventario/atributo-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import AtributosPage from './atributos-page';

describe('AtributosPage', () => {
  const list = vi.fn();
  const remove = vi.fn();
  const open = vi.fn();
  const confirm = vi.fn();
  const hasPermission = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    list.mockResolvedValue({
      data: [{ id: 'a1', nombre: 'Color', usoProductos: 2 }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      totalRegistrados: 5,
      totalEnUso: 2,
    });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient({ defaultOptions: { queries: { retry: false } } })),
        { provide: AtributoApi, useValue: { list, remove } },
        { provide: Dialog, useValue: { open } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: AuthorizationService, useValue: { hasPermission } },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('muestra contadores y uso real sin ofrecer acciones sin permisos', async () => {
    hasPermission.mockReturnValue(false);
    const fixture = TestBed.createComponent(AtributosPage);
    await vi.waitFor(() => expect(fixture.componentInstance.result()?.totalRegistrados).toBe(5));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 productos');
    expect(fixture.nativeElement.querySelector('table tbody tr')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ul[aria-label="Listado de atributos"] li')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button.btn-primary')).toBeNull();
    fixture.componentInstance.openCreate();
    expect(open).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('busca, pagina y abre el formulario con permisos', async () => {
    hasPermission.mockReturnValue(true);
    const fixture = TestBed.createComponent(AtributosPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.result()?.data.length).toBe(1));
    page.searchAttributes(' Color ');
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 10, 'Color'));
    page.page.set(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 10, 'Color'));
    page.openCreate();
    page.openEdit({ id: 'a1', nombre: 'Color', usoProductos: 2 });
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ariaModal: true, restoreFocus: true }),
    );
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ id: 'a1' }) }),
    );
    fixture.destroy();
  });

  it('actualiza las acciones cuando cambian los permisos', async () => {
    const granted = signal<string[]>([]);
    hasPermission.mockImplementation((_system: string, code: string) => granted().includes(code));
    const fixture = TestBed.createComponent(AtributosPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.result()?.data.length).toBe(1));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.btn-primary')).toBeNull();
    page.openCreate();
    expect(open).not.toHaveBeenCalled();

    granted.set([PERMISSION_CODES.ATRIBUTOS_CREATE]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.btn-primary')).not.toBeNull();
    page.openCreate();
    expect(open).toHaveBeenCalledOnce();

    granted.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.btn-primary')).toBeNull();
    page.openCreate();
    expect(open).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('confirma antes de eliminar y explica el conflicto de uso', async () => {
    hasPermission.mockReturnValue(true);
    const fixture = TestBed.createComponent(AtributosPage);
    const page = fixture.componentInstance;
    const atributo = { id: 'a1', nombre: 'Color', usoProductos: 2 };
    confirm.mockReturnValueOnce(of(false));
    await page.remove(atributo);
    expect(remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(of(true));
    remove.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    await page.remove(atributo);
    expect(page.actionError()).toContain('está en uso');
    remove.mockResolvedValue(undefined);
    await page.remove(atributo);
    expect(remove).toHaveBeenCalledWith('a1');
    expect(page.actionError()).toBe('');
    fixture.destroy();
  });
});
