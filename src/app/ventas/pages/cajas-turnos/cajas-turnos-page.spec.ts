import { TestBed } from '@angular/core/testing';
import { CajasTurnosDemoStore } from '../../demo/cajas-turnos-demo.store';
import CajasTurnosPage, { parsearCentavos } from './cajas-turnos-page';

describe('página de cajas y turnos de prueba', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  function montar() {
    const fixture = TestBed.createComponent(CajasTurnosPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, store: fixture.debugElement.injector.get(CajasTurnosDemoStore) };
  }

  it('muestra la demo, dos cajas y cifras separadas por medio', () => {
    const { fixture } = montar();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Demo · datos de prueba');
    expect(texto).toContain('Caja principal');
    expect(texto).toContain('Caja secundaria');
    expect(texto).toContain('160.00');
    expect(texto).toContain('100.00');
    expect(texto).toContain('68.00');
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(2);
  });

  it('filtra por abiertas y cerradas sin confundir turno cerrado con día cerrado', () => {
    const { fixture, page, store } = montar();
    page.cambiarFiltro('abiertas');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Caja principal');
    page.cambiarFiltro('cerradas');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Día cerrado');
    store.cerrarTurno('demo-caja-1', 'turno', 16000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Sin turno activo');
  });

  it('busca por nombre o código y muestra el estado sin resultados', () => {
    const { fixture } = montar();
    const buscar = fixture.nativeElement.querySelector('#buscar-caja') as HTMLInputElement;
    buscar.value = 'cj-002';
    buscar.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Caja secundaria');
    buscar.value = 'inexistente';
    buscar.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('No hay cajas que coincidan');
  });

  it('deja de contar el efectivo de una caja cerrada, pero conserva sus ventas del día', () => {
    const { fixture, store } = montar();
    store.cerrarTurno('demo-caja-1', 'turno', 16000);
    fixture.detectChanges();
    expect(store.resumen()).toEqual({
      efectivoEnCajaCentavos: 0, ventasEfectivoCentavos: 10000, ventasYapeCentavos: 6800,
    });
    expect(fixture.nativeElement.textContent).toContain('100.00');
    expect(fixture.nativeElement.textContent).toContain('68.00');
  });

  it('convierte importes decimales exactos y rechaza valores no monetarios', () => {
    expect(parsearCentavos('0')).toBe(0);
    expect(parsearCentavos('12,5')).toBe(1250);
    expect(parsearCentavos('12.05')).toBe(1205);
    expect(parsearCentavos('12.005')).toBeNull();
    expect(parsearCentavos('-1')).toBeNull();
    expect(parsearCentavos('')).toBeNull();
    expect(parsearCentavos('99999999999999999.99')).toBeNull();
  });

  it('crea una caja con solo nombre y valida el primer saldo al abrir el turno', () => {
    const { fixture, store } = montar();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[aria-controls="crear-caja-formulario"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('#crear-caja-formulario form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(root.textContent).toContain('Ingresa el nombre');
    const nombre = root.querySelector('#nombre-nueva-caja') as HTMLInputElement;
    nombre.value = 'Caja adicional';
    nombre.dispatchEvent(new Event('input'));
    (root.querySelector('#crear-caja-formulario form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    const caja = store.datos().cajas[2];
    expect(caja).toMatchObject({ codigo: 'CJ-003', nombre: 'Caja adicional' });
    const articulo = [...root.querySelectorAll('article')].find((node) => node.textContent?.includes('CJ-003'))!;
    (articulo.querySelector('[aria-controls^="apertura-"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (articulo.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(articulo.textContent).toContain('Ingresa un saldo inicial válido');
    const saldo = articulo.querySelector('input[inputmode="decimal"]') as HTMLInputElement;
    saldo.value = '12,50';
    saldo.dispatchEvent(new Event('input'));
    (articulo.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(store.turnoAbierto(caja.id)?.saldoInicialCentavos).toBe(1250);
    expect(root.textContent).toContain('3');
  });

  it('muestra saldo heredado en la reapertura y no permite editarlo', () => {
    const { fixture, store } = montar();
    store.cerrarTurno('demo-caja-1', 'turno', 15500);
    fixture.detectChanges();
    const articulo = [...(fixture.nativeElement as HTMLElement).querySelectorAll('article')].find((node) => node.textContent?.includes('CJ-001'))!;
    (articulo.querySelector('[aria-controls^="apertura-"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(articulo.textContent).toContain('Saldo heredado del cierre anterior');
    expect(articulo.querySelector('input[inputmode="decimal"]')).toBeNull();
    (articulo.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    expect(store.turnoAbierto('demo-caja-1')?.saldoInicialCentavos).toBe(15500);
  });

  it('registra solo movimientos manuales en la actividad y cambia el efectivo esperado', () => {
    const { fixture, store } = montar();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Apertura · Turno #1');
    expect(root.textContent).toContain('Cierre del día');
    expect(root.querySelector('app-actividad-reciente-caja')?.textContent).not.toContain('demo-venta');
    const principal = [...root.querySelectorAll('article')].find((node) => node.textContent?.includes('CJ-001'))!;
    (principal.querySelector('button[aria-controls^="movimiento-"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (principal.querySelector('form[id^="movimiento-"]') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(principal.textContent).toContain('importe mayor');
    const importe = principal.querySelector('input[inputmode="decimal"]') as HTMLInputElement;
    importe.value = '5,25';
    importe.dispatchEvent(new Event('input'));
    const motivo = principal.querySelector('input[placeholder="Describe el movimiento"]') as HTMLInputElement;
    motivo.value = 'Gasto imprevisto';
    motivo.dispatchEvent(new Event('input'));
    const tipo = principal.querySelector('select') as HTMLSelectElement;
    tipo.value = 'egreso';
    tipo.dispatchEvent(new Event('change'));
    (principal.querySelector('form[id^="movimiento-"]') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(store.resumen().efectivoEnCajaCentavos).toBe(15475);
    expect(root.querySelector('app-actividad-reciente-caja')?.textContent).toContain('Gasto imprevisto');
    expect(store.datos().ventas).toHaveLength(2);
    expect(store.datos().movimientos).toHaveLength(4);
  });
});
