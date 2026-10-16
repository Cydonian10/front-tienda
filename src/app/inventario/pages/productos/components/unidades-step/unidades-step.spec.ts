import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { ProductoApi } from '../../../../../api/inventario/product-api';
import { UnidadProductoApi } from '../../../../../api/inventario/unidad-producto-api';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../../../../shared/services/toast/toast.service';
import {
  catalogoUnidadesQueryKey,
  productoUnidadesQueryKey,
} from '../../../../actions/use-producto-unidades-action';
import { UnidadesStep } from './unidades-step';

describe('UnidadesStep', () => {
  const catalog = [
    { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
    { id: 'u2', nombre: 'Caja', simbolo: 'cja' },
  ];
  const assignment = { id: 'as1', productoId: 'p1', unidadId: 'u2', factorABase: '12.50000000' };
  const product = {
    id: 'p1',
    nombre: 'Tornillo',
    descripcion: null,
    unidadBaseId: 'u1',
    activo: true,
    imagenes: [],
  };
  const unitsApi = { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() };
  const confirmation = { confirm: vi.fn() };
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(catalogoUnidadesQueryKey, catalog);
    client.setQueryData(productoUnidadesQueryKey('p1'), []);
    unitsApi.list.mockResolvedValue([]);
    confirmation.confirm.mockReturnValue(of(true));
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ProductoApi, useValue: { listUnidades: vi.fn().mockResolvedValue(catalog) } },
        { provide: UnidadProductoApi, useValue: unitsApi },
        { provide: ConfirmDialogService, useValue: confirmation },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(UnidadesStep);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra la unidad base real y solo permite elegir secundarias no asociadas', () => {
    const fixture = render();
    expect(fixture.nativeElement.textContent).toContain('Unidad base: Unidad (u)');
    const options = Array.from(
      fixture.nativeElement.querySelectorAll('#secondary-unit option'),
    ) as HTMLOptionElement[];
    expect(options.map((option) => option.value)).toEqual(['', 'u2']);
  });

  it('valida y agrega el factor decimal preservando la precisión', async () => {
    const fixture = render();
    await fixture.componentInstance.add(new Event('submit'));
    expect(unitsApi.create).not.toHaveBeenCalled();
    fixture.componentInstance.createModel.set({ unidadId: 'u2', factorABase: '0' });
    await fixture.componentInstance.add(new Event('submit'));
    expect(unitsApi.create).not.toHaveBeenCalled();

    unitsApi.create.mockResolvedValue(assignment);
    unitsApi.list.mockResolvedValue([assignment]);
    fixture.componentInstance.createModel.set({ unidadId: 'u2', factorABase: '12.50000000' });
    fixture.detectChanges();
    await fixture.componentInstance.add(new Event('submit'));
    expect(unitsApi.create).toHaveBeenCalledWith('p1', {
      unidadId: 'u2',
      factorABase: '12.50000000',
    });
    await vi.waitFor(() => expect(fixture.componentInstance.assignments()).toEqual([assignment]));
    expect(fixture.componentInstance.createModel()).toEqual({ unidadId: '', factorABase: '' });
  });

  it('edita el factor sin cambiar la unidad y solo elimina tras confirmar', async () => {
    client.setQueryData(productoUnidadesQueryKey('p1'), [assignment]);
    const fixture = render();
    fixture.componentInstance.startEdit(assignment);
    expect(fixture.componentInstance.editModel().factorABase).toBe('12.50000000');
    const updated = { ...assignment, factorABase: '24.25' };
    unitsApi.update.mockResolvedValue(updated);
    unitsApi.list.mockResolvedValue([updated]);
    fixture.componentInstance.editModel.set({ factorABase: '24.25' });
    await fixture.componentInstance.saveEdit(new Event('submit'), assignment);
    expect(unitsApi.update).toHaveBeenCalledWith('p1', 'as1', { factorABase: '24.25' });
    await vi.waitFor(() => expect(fixture.componentInstance.assignments()).toEqual([updated]));

    confirmation.confirm.mockReturnValueOnce(of(false));
    await fixture.componentInstance.remove(updated);
    expect(unitsApi.remove).not.toHaveBeenCalled();
    unitsApi.remove.mockResolvedValue(undefined);
    unitsApi.list.mockResolvedValue([]);
    await fixture.componentInstance.remove(updated);
    expect(unitsApi.remove).toHaveBeenCalledWith('p1', 'as1');
    await vi.waitFor(() => expect(fixture.componentInstance.assignments()).toEqual([]));
  });
});
