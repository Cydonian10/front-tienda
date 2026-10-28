import { TestBed } from '@angular/core/testing';
import { CajasTurnosDemoStore } from './cajas-turnos-demo.store';

describe('CajasTurnosDemoStore', () => {
  let store: CajasTurnosDemoStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CajasTurnosDemoStore] });
    store = TestBed.inject(CajasTurnosDemoStore);
  });
  afterEach(() => TestBed.resetTestingModule());

  it('genera el siguiente código libre y rechaza nombres vacíos', () => {
    expect(() => store.crearCaja('   ')).toThrow('nombre');
    expect(store.crearCaja(' Mostrador nuevo ').codigo).toBe('CJ-003');
    expect(store.crearCaja('Otra caja').codigo).toBe('CJ-004');
    expect(store.datos().cajas[2].nombre).toBe('Mostrador nuevo');
  });

  it('valida el primer saldo y hereda el efectivo contado en los siguientes turnos', () => {
    const caja = store.crearCaja('Nueva');
    expect(() => store.abrirTurno(caja.id)).toThrow('saldo inicial');
    expect(() => store.abrirTurno(caja.id, -1)).toThrow('saldo inicial');
    expect(() => store.abrirTurno(caja.id, 1.5)).toThrow('saldo inicial');
    const primero = store.abrirTurno(caja.id, 0);
    expect(primero.numero).toBe(1);
    expect(() => store.abrirTurno(caja.id, 0)).toThrow('turno abierto');
    const cerrado = store.cerrarTurno(caja.id, 'turno', 355);
    expect(cerrado.diferenciaCentavos).toBe(355);
    expect(() => store.abrirTurno(caja.id, 999)).toThrow('se hereda');
    expect(store.abrirTurno(caja.id).saldoInicialCentavos).toBe(355);
  });

  it('rechaza movimientos inválidos o en turnos cerrados sin cambiar saldos', () => {
    const caja = store.datos().cajas[0];
    expect(() => store.registrarMovimiento(caja.id, 'ingreso', 0, 'Cambio')).toThrow('mayor');
    expect(() => store.registrarMovimiento(caja.id, 'egreso', 1.2, 'Gasto')).toThrow('mayor');
    expect(() => store.registrarMovimiento(caja.id, 'ingreso', 100, '  ')).toThrow('motivo');
    expect(store.resumen().efectivoEnCajaCentavos).toBe(16000);
    expect(store.registrarMovimiento(caja.id, 'egreso', 500, ' Gasto ')).toMatchObject({
      importeCentavos: 500, motivo: 'Gasto', responsable: 'Operador demo',
    });
    expect(store.resumen().efectivoEnCajaCentavos).toBe(15500);
    store.cerrarTurno(caja.id, 'turno', 15500);
    expect(() => store.registrarMovimiento(caja.id, 'ingreso', 100, 'Tarde')).toThrow('turno abierto');
  });

  it('registra diferencias sin ajustarlas y prohíbe reabrir el día cerrado', () => {
    const caja = store.datos().cajas[0];
    expect(() => store.cerrarTurno(caja.id, 'dia', Number.NaN)).toThrow('efectivo contado');
    const cerrado = store.cerrarTurno(caja.id, 'dia', 15500, '  Faltante  ');
    expect(cerrado).toMatchObject({
      tipoCierre: 'dia', efectivoContadoCentavos: 15500, diferenciaCentavos: -500,
      observacion: 'Faltante',
    });
    expect(store.diaCerrado(caja.id)).toBe(true);
    expect(store.resumen().efectivoEnCajaCentavos).toBe(0);
    expect(store.resumen().ventasEfectivoCentavos).toBe(10000);
    expect(() => store.abrirTurno(caja.id)).toThrow('día');
    expect(() => store.cerrarTurno(caja.id, 'turno', 100)).toThrow('turno abierto');
  });

  it('solo avanza sin turnos abiertos y conserva los turnos de fechas anteriores', () => {
    const anterior = store.fechaOperativa();
    expect(() => store.avanzarDia()).toThrow('turnos abiertos');
    store.cerrarTurno(store.datos().cajas[0].id, 'turno', 16000);
    const siguiente = store.avanzarDia();
    expect(siguiente).not.toBe(anterior);
    expect(store.resumen()).toEqual({
      efectivoEnCajaCentavos: 0, ventasEfectivoCentavos: 0, ventasYapeCentavos: 0,
    });
    expect(store.turnosDeCaja('demo-caja-2', anterior)).toHaveLength(2);
    expect(store.abrirTurno('demo-caja-2', 0).saldoInicialCentavos).toBe(0);
  });
});
