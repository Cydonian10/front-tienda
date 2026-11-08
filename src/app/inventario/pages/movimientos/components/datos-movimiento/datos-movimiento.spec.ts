import { TestBed } from '@angular/core/testing';
import { DatosMovimiento } from './datos-movimiento';

describe('DatosMovimiento', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  function create(tipo: 'salida' | 'traslado' | 'ajuste' = 'traslado') {
    const fixture = TestBed.createComponent(DatosMovimiento);
    const inputs = {
      tipo,
      titulo: 'Datos del movimiento',
      origen: '',
      destino: '',
      motivo: '',
      almacenes: [{ id: 'almacen-api-1', nombre: 'Almacén de la API' }],
      cargandoAlmacenes: false,
      errorAlmacenes: false,
    };
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra solo los almacenes recibidos y emite las selecciones', () => {
    const fixture = create();
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    expect(selects).toHaveLength(2);
    expect(selects[0].options).toHaveLength(2);
    expect(selects[1].options[1].value).toBe('almacen-api-1');
    expect(selects[1].options[1].textContent).toContain('Almacén de la API');
    const origin = vi.fn();
    const destination = vi.fn();
    fixture.componentInstance.origenChange.subscribe(origin);
    fixture.componentInstance.destinoChange.subscribe(destination);
    selects[0].value = 'almacen-api-1';
    selects[0].dispatchEvent(new Event('change'));
    selects[1].value = 'almacen-api-1';
    selects[1].dispatchEvent(new Event('change'));
    expect(origin).toHaveBeenCalledWith('almacen-api-1');
    expect(destination).toHaveBeenCalledWith('almacen-api-1');
  });

  it('distingue carga, lista vacía y error recuperable sin permitir seleccionar datos obsoletos', () => {
    const fixture = create();
    const select = () => fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    fixture.componentRef.setInput('cargandoAlmacenes', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Cargando almacenes');
    expect(select().disabled).toBe(true);

    fixture.componentRef.setInput('cargandoAlmacenes', false);
    fixture.componentRef.setInput('almacenes', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('No hay almacenes activos');
    expect(select().disabled).toBe(true);

    fixture.componentRef.setInput('errorAlmacenes', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar');
    expect(select().disabled).toBe(true);
    const retry = vi.fn();
    fixture.componentInstance.reintentarAlmacenes.subscribe(retry);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(retry).toHaveBeenCalledOnce();
  });

  it('solo muestra destino para traslados', () => {
    const fixture = create('ajuste');
    expect(fixture.nativeElement.querySelector('#movimiento-destino')).toBeNull();
    expect(fixture.nativeElement.querySelector('#movimiento-origen')).not.toBeNull();
  });
});
