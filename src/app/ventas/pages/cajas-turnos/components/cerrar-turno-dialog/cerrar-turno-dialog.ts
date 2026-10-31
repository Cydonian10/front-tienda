import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { useResumenTurno } from '../../../../actions/use-caja-turnos-action';

export function importeEnCentavos(importe: string, admiteNegativo = false): bigint | null {
  const patron = admiteNegativo ? /^-?\d{1,16}(\.\d{1,2})?$/ : /^\d{1,16}(\.\d{1,2})?$/;
  if (!patron.test(importe)) return null;
  const negativo = importe.startsWith('-');
  const [entero, decimal = ''] = (negativo ? importe.slice(1) : importe).split('.');
  const centavos = BigInt(entero) * 100n + BigInt(decimal.padEnd(2, '0'));
  return negativo ? -centavos : centavos;
}

export function diferenciaFormateada(centavos: bigint): string {
  const signo = centavos < 0n ? '−' : centavos > 0n ? '+' : '';
  const valor = centavos < 0n ? -centavos : centavos;
  return `${signo}S/ ${valor / 100n}.${(valor % 100n).toString().padStart(2, '0')}`;
}

@Component({
  selector: 'app-cerrar-turno-dialog',
  imports: [DialogShell],
  templateUrl: './cerrar-turno-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CerrarTurnoDialog {
  readonly data = inject<{ cajaId: string; nombre: string; turnoId: string }>(DIALOG_DATA);
  readonly dialogRef = inject(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly efectivoContado = signal('');
  readonly observacionCierre = signal('');
  readonly contadoTocado = signal(false);
  readonly resumenQuery = useResumenTurno(() => this.data.cajaId, () => this.data.turnoId);
  readonly contadoCentavos = computed(() => importeEnCentavos(this.efectivoContado().trim()));
  readonly contadoInvalido = computed(() =>
    this.contadoCentavos() === null && (this.contadoTocado() || this.efectivoContado().length > 0),
  );
  readonly observacionInvalida = computed(() => this.observacionCierre().length > 500);
  readonly formularioValido = computed(() => this.contadoCentavos() !== null && !this.observacionInvalida());
  readonly diferencia = computed(() => {
    const contado = this.contadoCentavos();
    const esperado = this.resumenQuery.data()?.efectivoEsperado;
    const esperadoCentavos = esperado === undefined ? null : importeEnCentavos(esperado, true);
    return contado === null || esperadoCentavos === null ? null : contado - esperadoCentavos;
  });
  readonly diferenciaTexto = computed(() => {
    const diferencia = this.diferencia();
    return diferencia === null ? null : diferenciaFormateada(diferencia);
  });

  get turnoCerrado(): boolean {
    const error = this.resumenQuery.error();
    return error instanceof HttpErrorResponse && error.status === 409;
  }
}
