import { DOCUMENT } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { afterNextRender, Component, computed, ElementRef, inject, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import { parsearCentavos } from '../../../demo/cajas-turnos-demo-calculos';
import type { DemoCaja, DemoTurno, ResumenTurnoDemo, TipoCierreDemo } from '../../../demo/cajas-turnos-demo.models';

const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

@Component({
  selector: 'app-cierre-turno-dialog',
  imports: [CdkTrapFocus],
  templateUrl: './cierre-turno-dialog.html',
})
export class CierreTurnoDialog implements OnDestroy {
  readonly caja = input.required<DemoCaja>();
  readonly turno = input.required<DemoTurno>();
  readonly resumen = input.required<ResumenTurnoDemo>();
  readonly tipo = input.required<TipoCierreDemo>();
  readonly errorExterno = input('');
  readonly cancelado = output<void>();
  readonly confirmado = output<{ contadoCentavos: number; observacion: string }>();
  readonly contado = signal('');
  readonly observacion = signal('');
  readonly error = signal('');
  readonly diferencia = computed(() => {
    const centavos = parsearCentavos(this.contado());
    return centavos === null ? null : centavos - this.resumen().efectivoEsperadoCentavos;
  });

  private readonly document = inject(DOCUMENT);
  private readonly focoAnterior = this.document.activeElement;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => {
      this.dialog().nativeElement.showModal?.();
      this.dialog().nativeElement.querySelector<HTMLButtonElement>('[data-cancelar]')?.focus();
    });
  }

  moneda(centavos: number): string {
    return formatoMoneda.format(centavos / 100);
  }

  solicitarCancelacion(evento?: Event): void {
    evento?.preventDefault();
    this.cancelado.emit();
  }

  enviar(evento: Event): void {
    evento.preventDefault();
    const contadoCentavos = parsearCentavos(this.contado());
    if (contadoCentavos === null) {
      this.error.set('Ingresa el efectivo realmente contado (S/), con hasta dos decimales.');
      return;
    }
    this.error.set('');
    this.confirmado.emit({ contadoCentavos, observacion: this.observacion() });
  }

  ngOnDestroy(): void {
    const cajaId = this.caja().id;
    queueMicrotask(() => {
      if (this.focoAnterior instanceof HTMLElement && this.focoAnterior.isConnected) {
        this.focoAnterior.focus();
        return;
      }
      const nuevaAccion = this.document.querySelector<HTMLElement>(`[aria-controls="apertura-${cajaId}"]`);
      (nuevaAccion ?? this.document.getElementById(`caja-${cajaId}`))?.focus();
    });
  }
}
