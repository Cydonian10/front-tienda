import { TestBed } from '@angular/core/testing';
import { CajasTurnosDemoStore } from '../../demo/cajas-turnos-demo.store';
import CajasTurnosPage from './cajas-turnos-page';

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
});
