import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import type {
  ProductResponse,
  Unidad,
} from '../../../../../api/interfaces/inventario/producto.interface';
import type { UnidadProductoResponse } from '../../../../../api/interfaces/inventario/unidad-producto.interface';
import { useProductoUnidadesApi } from '../../../../actions/use-producto-unidades-action';
import { ConfirmDialogService } from '../../../../../shared/services/confirm-dialog/confirm-dialog.service';

const FACTOR_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,8})?$/;

@Component({
  selector: 'unidades-step',
  imports: [FormField],
  templateUrl: './unidades-step.html',
  host: { class: 'block' },
})
export class UnidadesStep {
  private readonly confirmation = inject(ConfirmDialogService);
  readonly product = input.required<ProductResponse>();
  private readonly actions = useProductoUnidadesApi(() => this.product().id);
  readonly catalogQuery = this.actions.catalogQuery;
  readonly assignmentsQuery = this.actions.assignmentsQuery;
  readonly catalog = computed(() => this.catalogQuery.data() ?? []);
  readonly assignments = computed(() => this.assignmentsQuery.data() ?? []);
  readonly baseUnit = computed(() =>
    this.catalog().find((unit) => unit.id === this.product().unidadBaseId),
  );
  readonly available = computed(() =>
    this.catalog().filter(
      (unit) =>
        unit.id !== this.product().unidadBaseId &&
        !this.assignments().some((item) => item.unidadId === unit.id),
    ),
  );
  readonly loading = computed(
    () => this.catalogQuery.isPending() || this.assignmentsQuery.isPending(),
  );
  readonly loadError = computed(
    () => this.catalogQuery.isError() || this.assignmentsQuery.isError(),
  );
  readonly busy = computed(
    () =>
      this.actions.createMutation.isPending() ||
      this.actions.updateMutation.isPending() ||
      this.actions.removeMutation.isPending(),
  );
  readonly editingId = signal<string | null>(null);
  readonly actionError = signal('');

  readonly createModel = signal({ unidadId: '', factorABase: '' });
  readonly createForm = form(this.createModel, (path) => {
    required(path.unidadId, { message: 'Elige una unidad secundaria.' });
    validate(path.factorABase, ({ value }) => this.factorError(value()));
  });
  readonly editModel = signal({ factorABase: '' });
  readonly editForm = form(this.editModel, (path) => {
    validate(path.factorABase, ({ value }) => this.factorError(value()));
  });

  private factorError(value: string) {
    // El factor viaja como texto para conservar hasta ocho decimales, igual que en la API.
    return FACTOR_PATTERN.test(value.trim()) && /[1-9]/.test(value)
      ? null
      : { kind: 'factor', message: 'Ingresa un factor mayor que cero, con hasta 8 decimales.' };
  }

  retryLoad(): void {
    if (this.catalogQuery.isError()) void this.catalogQuery.refetch();
    if (this.assignmentsQuery.isError()) void this.assignmentsQuery.refetch();
  }

  unitFor(item: UnidadProductoResponse): Unidad | undefined {
    return this.catalog().find((unit) => unit.id === item.unidadId);
  }

  startEdit(item: UnidadProductoResponse): void {
    if (this.busy()) return;
    this.editingId.set(item.id);
    this.editForm().reset({ factorABase: item.factorABase });
    this.actionError.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.actionError.set('');
  }

  async add(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy() || this.loadError() || this.loading()) return;
    await submit(this.createForm, async (state) => {
      const dto = state().value();
      if (!this.available().some((unit) => unit.id === dto.unidadId)) {
        this.actionError.set('Elige una unidad secundaria disponible.');
        return;
      }
      this.actionError.set('');
      try {
        await this.actions.createMutation.mutateAsync({
          id: this.product().id,
          dto: { unidadId: dto.unidadId, factorABase: dto.factorABase.trim() },
        });
        this.createForm().reset({ unidadId: '', factorABase: '' });
      } catch {
        this.actionError.set(
          'No se pudo agregar la unidad. Comprueba si ya pertenece al producto e inténtalo de nuevo.',
        );
      }
    });
  }

  async saveEdit(event: Event, item: UnidadProductoResponse): Promise<void> {
    event.preventDefault();
    if (this.busy() || this.editingId() !== item.id) return;
    await submit(this.editForm, async (state) => {
      this.actionError.set('');
      try {
        await this.actions.updateMutation.mutateAsync({
          id: this.product().id,
          assignmentId: item.id,
          dto: { factorABase: state().value().factorABase.trim() },
        });
        this.editingId.set(null);
      } catch {
        this.actionError.set('No se pudo actualizar el factor. Inténtalo de nuevo.');
      }
    });
  }

  async remove(item: UnidadProductoResponse): Promise<void> {
    if (this.busy()) return;
    const unit = this.unitFor(item);
    const confirmed = await firstValueFrom(
      this.confirmation.confirm({
        title: 'Eliminar unidad secundaria',
        message: `¿Quitar ${unit?.nombre ?? 'esta unidad'} del producto? La unidad base y los movimientos registrados no se eliminarán.`,
        confirmText: 'Eliminar unidad',
        tone: 'danger',
      }),
    );
    if (!confirmed || this.busy()) return;
    this.actionError.set('');
    try {
      await this.actions.removeMutation.mutateAsync({
        id: this.product().id,
        assignmentId: item.id,
      });
      if (this.editingId() === item.id) this.editingId.set(null);
    } catch {
      this.actionError.set('No se pudo eliminar la unidad secundaria. Inténtalo de nuevo.');
    }
  }
}
