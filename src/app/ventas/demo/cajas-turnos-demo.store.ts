import { computed, Injectable, signal } from '@angular/core';
import { diaCerrado, resumenDia, resumenTurno, saldoSiguienteTurno, turnosCajaDia } from './cajas-turnos-demo-calculos';
import { datosInicialesCaja, fechaOperativaLima, siguienteFechaOperativa } from './cajas-turnos-demo-data';
import type {
  DatosDemoCaja, DemoCaja, DemoMovimientoCaja, DemoTurno, TipoCierreDemo, TipoMovimientoDemo,
} from './cajas-turnos-demo.models';

function centavosValidos(importe: number, permiteCero: boolean): boolean {
  return Number.isSafeInteger(importe) && (permiteCero ? importe >= 0 : importe > 0);
}

@Injectable()
export class CajasTurnosDemoStore {
  readonly fechaOperativa = signal(fechaOperativaLima());
  readonly datos = signal<DatosDemoCaja>(datosInicialesCaja(this.fechaOperativa()));
  readonly resumen = computed(() => resumenDia(this.fechaOperativa(), this.datos()));
  readonly cajasAbiertas = computed(() => this.datos().turnos.filter((turno) =>
    turno.fechaOperativa === this.fechaOperativa() && turno.fechaCierre === null).length);

  private secuencia = 0;

  turnosDeCaja(cajaId: string, fechaOperativa = this.fechaOperativa()): DemoTurno[] {
    return turnosCajaDia(this.datos().turnos, cajaId, fechaOperativa);
  }

  turnoAbierto(cajaId: string): DemoTurno | undefined {
    return this.turnosDeCaja(cajaId).find((turno) => turno.fechaCierre === null);
  }

  diaCerrado(cajaId: string): boolean {
    return diaCerrado(this.datos().turnos, cajaId, this.fechaOperativa());
  }

  saldoSiguiente(cajaId: string): number | null {
    return saldoSiguienteTurno(this.datos().turnos, cajaId, this.fechaOperativa());
  }

  crearCaja(nombre: string): DemoCaja {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) throw new Error('Ingresa el nombre de la caja.');
    const usados = new Set(this.datos().cajas.map((caja) => caja.codigo));
    let numero = 1;
    while (usados.has(`CJ-${String(numero).padStart(3, '0')}`)) numero++;
    const caja: DemoCaja = {
      id: this.nuevoId('caja'), codigo: `CJ-${String(numero).padStart(3, '0')}`,
      nombre: nombreLimpio, activo: true,
    };
    this.datos.update((actual) => ({ ...actual, cajas: [...actual.cajas, caja] }));
    return caja;
  }

  abrirTurno(cajaId: string, saldoInicialCentavos?: number): DemoTurno {
    this.exigirCaja(cajaId);
    if (this.turnoAbierto(cajaId)) throw new Error('Esta caja ya tiene un turno abierto.');
    if (this.diaCerrado(cajaId)) throw new Error('El día de esta caja ya está cerrado.');
    const anteriores = this.turnosDeCaja(cajaId);
    const saldoAnterior = this.saldoSiguiente(cajaId);
    if (saldoAnterior !== null && saldoInicialCentavos !== undefined) {
      throw new Error('El saldo del siguiente turno se hereda del efectivo contado.');
    }
    const saldo = saldoAnterior ?? saldoInicialCentavos;
    if (saldo === undefined || !centavosValidos(saldo, true)) {
      throw new Error('Ingresa un saldo inicial válido, desde S/ 0.00.');
    }
    const turno: DemoTurno = {
      id: this.nuevoId('turno'), cajaId, numero: (anteriores.at(-1)?.numero ?? 0) + 1,
      fechaOperativa: this.fechaOperativa(), fechaApertura: this.instanteDemo(), fechaCierre: null,
      saldoInicialCentavos: saldo, efectivoContadoCentavos: null, diferenciaCentavos: null,
      tipoCierre: null, observacion: null, responsableApertura: 'Operador demo', responsableCierre: null,
    };
    this.datos.update((actual) => ({ ...actual, turnos: [...actual.turnos, turno] }));
    return turno;
  }

  registrarMovimiento(cajaId: string, tipo: TipoMovimientoDemo, importeCentavos: number, motivo: string): DemoMovimientoCaja {
    const turno = this.exigirTurnoAbierto(cajaId);
    if (tipo !== 'ingreso' && tipo !== 'egreso') throw new Error('Selecciona un tipo de movimiento válido.');
    if (!centavosValidos(importeCentavos, false)) throw new Error('El importe debe ser mayor que S/ 0.00.');
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) throw new Error('Ingresa el motivo del movimiento.');
    const movimiento: DemoMovimientoCaja = {
      id: this.nuevoId('movimiento'), turnoId: turno.id, tipo, importeCentavos,
      motivo: motivoLimpio, responsable: 'Operador demo', fecha: this.instanteDemo(),
    };
    this.datos.update((actual) => ({ ...actual, movimientos: [...actual.movimientos, movimiento] }));
    return movimiento;
  }

  cerrarTurno(cajaId: string, tipoCierre: TipoCierreDemo, efectivoContadoCentavos: number, observacion = ''): DemoTurno {
    const turno = this.exigirTurnoAbierto(cajaId);
    if (tipoCierre !== 'turno' && tipoCierre !== 'dia') throw new Error('Selecciona un cierre válido.');
    if (!centavosValidos(efectivoContadoCentavos, true)) {
      throw new Error('Ingresa el efectivo contado, desde S/ 0.00.');
    }
    const esperado = resumenTurno(turno, this.datos().ventas, this.datos().movimientos).efectivoEsperadoCentavos;
    const cerrado: DemoTurno = {
      ...turno, fechaCierre: this.instanteDemo(), tipoCierre,
      efectivoContadoCentavos, diferenciaCentavos: efectivoContadoCentavos - esperado,
      observacion: observacion.trim() || null, responsableCierre: 'Operador demo',
    };
    this.datos.update((actual) => ({
      ...actual, turnos: actual.turnos.map((item) => item.id === turno.id ? cerrado : item),
    }));
    return cerrado;
  }

  avanzarDia(): string {
    if (this.datos().turnos.some((turno) => turno.fechaCierre === null)) {
      throw new Error('Cierra los turnos abiertos antes de avanzar el día.');
    }
    const fecha = siguienteFechaOperativa(this.fechaOperativa());
    this.fechaOperativa.set(fecha);
    return fecha;
  }

  private exigirCaja(cajaId: string): DemoCaja {
    const caja = this.datos().cajas.find((item) => item.id === cajaId && item.activo);
    if (!caja) throw new Error('La caja no está disponible.');
    return caja;
  }

  private exigirTurnoAbierto(cajaId: string): DemoTurno {
    this.exigirCaja(cajaId);
    const turno = this.turnoAbierto(cajaId);
    if (!turno) throw new Error('La caja no tiene un turno abierto.');
    return turno;
  }

  private nuevoId(tipo: string): string {
    return `demo-${tipo}-nuevo-${++this.secuencia}`;
  }

  private instanteDemo(): string {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const campo = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value;
    return `${this.fechaOperativa()}T${campo('hour')}:${campo('minute')}:${campo('second')}-05:00`;
  }
}
