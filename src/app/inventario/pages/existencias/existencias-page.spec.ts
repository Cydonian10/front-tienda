import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../../api/inventario/existencia-api';
import ExistenciasPage, { promedio, soles } from './existencias-page';

describe('ExistenciasPage', () => {
  const listarAlmacenes = vi.fn();
  const listar = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    listarAlmacenes.mockResolvedValue([{ id: 'a1', nombre: 'Principal' }]);
    listar.mockImplementation(async (filtro: { almacenId: string; page: number }) => ({
      items: [],
      page: filtro.page,
      limit: 20,
      totalItems: 0,
      totalValorCosto: filtro.almacenId === 'todos' ? '120.000000' : '50.000000',
    }));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: ExistenciaApi, useValue: { listarAlmacenes, listar } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('no pide saldos al entrar; requiere selección explícita y muestra el total del almacén', async () => {
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(listarAlmacenes).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()).toEqual([{ id: 'a1', nombre: 'Principal' }]));
    fixture.detectChanges();
    expect(fixture.componentInstance.almacenId()).toBeNull();
    expect(listar).not.toHaveBeenCalled();
    const select = fixture.nativeElement.querySelector('#existencias-almacen') as HTMLSelectElement;
    expect(select.value).toBe('');

    select.value = 'a1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith(expect.objectContaining({ almacenId: 'a1', page: 1 })),
    );
    await vi.waitFor(() =>
      expect(fixture.componentInstance.existencias.data()?.totalValorCosto).toBe('50.000000'),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('S/ 50.00');

    fixture.componentInstance.page.set(2);
    fixture.componentInstance.elegirAlmacen('todos');
    expect(fixture.componentInstance.page()).toBe(1);
    await vi.waitFor(() =>
      expect(listar).toHaveBeenCalledWith(expect.objectContaining({ almacenId: 'todos', page: 1 })),
    );
  });

  it('distingue la ausencia de almacenes de la ausencia de filas sin pedir saldos', async () => {
    listarAlmacenes.mockResolvedValue([]);
    const fixture = TestBed.createComponent(ExistenciasPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.almacenes.data()).toEqual([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay almacenes activos');
    expect(listar).not.toHaveBeenCalled();
  });

  it('formatea PEN sin convertir cadenas monetarias a number y conserva seis decimales del promedio', () => {
    expect(soles('123456789012345678.125000')).toContain('123,456,789,012,345,678.13');
    expect(soles('0.000000')).toBe('S/ 0.00');
    expect(promedio(null)).toBe('—');
    expect(promedio('0.123457')).toBe('S/ 0.123457');
  });
});
