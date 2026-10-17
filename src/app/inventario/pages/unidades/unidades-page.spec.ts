import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { UnidadApi } from '../../../api/inventario/unidad-api';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { of } from 'rxjs';
import { unidadesQueryKey } from '../../actions/use-unidad-medida-action';
import UnidadesPage from './unidades-page';

describe('UnidadesPage', () => {
  const list = vi.fn();
  const open = vi.fn();
  const remove = vi.fn();
  const confirm = vi.fn();
  const hasPermission = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    list.mockResolvedValue({
      data: [{ id: 'u1', nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: UnidadApi, useValue: { list, remove } },
        { provide: Dialog, useValue: { open } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: AuthorizationService, useValue: { hasPermission } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('muestra el listado sin permitir crear si solo tiene permiso de lectura', async () => {
    hasPermission.mockReturnValue(false);
    const fixture = TestBed.createComponent(UnidadesPage);
    await vi.waitFor(() => expect(fixture.componentInstance.result()?.data[0].nombre).toBe('Caja'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Caja');
    expect(fixture.nativeElement.querySelector('table tbody tr')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ul[aria-label="Listado de unidades"] li')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button.btn-primary')).toBeNull();
    fixture.componentInstance.openCreate();
    expect(open).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('consulta por nombre, cambia de página y abre el modal con permiso de creación', async () => {
    hasPermission.mockReturnValue(true);
    const fixture = TestBed.createComponent(UnidadesPage);
    const page = fixture.componentInstance;
    await vi.waitFor(() => expect(page.result()?.meta.page).toBe(1));
    page.searchDraft.set(' Caja ');
    page.searchUnits(new Event('submit'));
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 5, 'Caja'));
    expect(page.search()).toBe('Caja');
    page.page.set(2);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(2, 5, 'Caja'));
    page.changePageSize(10);
    await vi.waitFor(() => expect(list).toHaveBeenCalledWith(1, 10, 'Caja'));
    expect(page.page()).toBe(1);
    expect(page.pageSize()).toBe(10);
    page.openCreate();
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ariaModal: true, restoreFocus: true }),
    );
    expect(client.getQueryData([...unidadesQueryKey, 1, 5, 'Caja'])).toBeTruthy();
    page.openEdit({ id: 'u1', nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' });
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ id: 'u1' }) }),
    );
    fixture.destroy();
  });

  it('elimina solo tras confirmar y muestra el conflicto si está en uso', async () => {
    hasPermission.mockReturnValue(true);
    const fixture = TestBed.createComponent(UnidadesPage);
    const page = fixture.componentInstance;
    const unidad = { id: 'u1', nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' };
    confirm.mockReturnValueOnce(of(false));
    await page.remove(unidad);
    expect(remove).not.toHaveBeenCalled();

    confirm.mockReturnValue(of(true));
    remove.mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    await page.remove(unidad);
    expect(page.actionError()).toContain('está en uso');

    remove.mockResolvedValue(undefined);
    await page.remove(unidad);
    expect(remove).toHaveBeenCalledWith('u1');
    expect(page.actionError()).toBe('');
    fixture.destroy();
  });
});
