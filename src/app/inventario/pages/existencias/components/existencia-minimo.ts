import { Component, computed, input, signal } from '@angular/core';
import { PERMISSION_CODES } from '../../../../api/interfaces/access-control/permision.interface';
import type { ExistenciaItem } from '../../../../api/interfaces/inventario/existencia.interface';
import { usePermissions } from '../../../../auth/services/use-permissions';
import { useEditarMinimoExistencia } from '../../../actions/use-existencias-action';

@Component({
  selector: 'app-existencia-minimo',
  templateUrl: './existencia-minimo.html',
  host: { class: 'block min-w-0' },
})
export class ExistenciaMinimo {
  readonly fila = input.required<ExistenciaItem>();
  readonly context = input('fila');
  readonly access = usePermissions('INVENTARIO', { edit: PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM });
  readonly mutation = useEditarMinimoExistencia();
  readonly editing = signal(false);
  readonly confirming = signal(false);
  readonly draft = signal('');
  readonly error = signal('');
  readonly busy = computed(() => this.mutation.guardar.isPending() || this.mutation.quitar.isPending());
  readonly invalid = computed(() => {
    const value = this.draft().trim();
    return !/^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/.test(value) || !/[1-9]/.test(value);
  });
  readonly inputId = computed(() => `minimo-${this.context()}-${this.fila().variante.id}-${this.fila().almacen.id}`);

  abrir(): void {
    if (!this.access.edit()) return;
    this.draft.set(this.fila().minimoBase ?? '');
    this.error.set('');
    this.confirming.set(false);
    this.editing.set(true);
  }

  cerrar(): void {
    if (this.busy()) return;
    this.editing.set(false);
    this.confirming.set(false);
    this.error.set('');
  }

  async guardar(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.access.edit() || this.busy()) return;
    if (this.invalid()) {
      this.error.set('Ingresa un mínimo positivo de hasta seis decimales en unidad base.');
      return;
    }
    this.error.set('');
    try {
      await this.mutation.guardar.mutateAsync({
        varianteId: this.fila().variante.id,
        almacenId: this.fila().almacen.id,
        minimoBase: this.draft().trim(),
      });
      this.editing.set(false);
      this.confirming.set(false);
    } catch (error) {
      this.error.set((error as { status?: number }).status === 403
        ? 'Ya no tienes permiso para editar mínimos.'
        : 'No se pudo guardar el mínimo. Revisa el valor e inténtalo de nuevo.');
    }
  }

  async quitar(): Promise<void> {
    if (!this.access.edit() || !this.confirming() || this.busy()) return;
    this.error.set('');
    try {
      await this.mutation.quitar.mutateAsync({
        varianteId: this.fila().variante.id,
        almacenId: this.fila().almacen.id,
      });
      this.editing.set(false);
      this.confirming.set(false);
    } catch (error) {
      this.error.set((error as { status?: number }).status === 403
        ? 'Ya no tienes permiso para quitar mínimos.'
        : 'No se pudo quitar el mínimo. Inténtalo de nuevo.');
    }
  }
}
