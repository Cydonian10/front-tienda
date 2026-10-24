import { Component, computed, HostListener, inject, signal, viewChild } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { CrearMarcaDto, EditarMarcaDto, Marca } from '../../../api/interfaces/inventario/marca.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { useMarcasApi, useMarcasListado } from '../../actions/use-marcas-action';
import { MarcaForm } from './components/marca-form';
import { MarcaImagen } from './components/marca-imagen';

@Component({
  selector: 'marcas-page',
  imports: [MarcaForm, MarcaImagen],
  templateUrl: './marcas-page.html',
  host: { class: 'block min-w-0' },
})
export default class MarcasPage {
  private readonly confirmation = inject(ConfirmDialogService);
  readonly access = usePermissions('INVENTARIO', { edit: PERMISSION_CODES.PRODUCTS_UPDATE });
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly search = signal('');
  readonly status = signal<'todos' | 'activos' | 'inactivos'>('todos');
  readonly activo = computed(() => this.status() === 'todos' ? undefined : this.status() === 'activos');
  readonly query = useMarcasListado(this.search, this.activo, this.page, this.limit);
  private readonly actions = useMarcasApi();
  readonly createMutation = this.actions.createMutation;
  readonly updateMutation = this.actions.updateMutation;
  readonly statusMutation = this.actions.statusMutation;
  readonly selection = signal<Marca | 'new' | null>(null);
  readonly form = viewChild(MarcaForm);
  readonly formError = signal('');
  readonly actionError = signal('');
  readonly saving = computed(() => this.createMutation.isPending() || this.updateMutation.isPending());
  readonly totalPages = computed(() => Math.max(1, Math.ceil((this.query.data()?.totalItems ?? 0) / this.limit())));

  searchBrands(value: string): void {
    this.page.set(1);
    this.search.set(value.trim().slice(0, 200));
  }

  changeStatus(value: string): void {
    if (value !== 'todos' && value !== 'activos' && value !== 'inactivos') return;
    this.page.set(1);
    this.status.set(value);
  }

  clearFilters(): void {
    this.page.set(1);
    this.search.set('');
    this.status.set('todos');
  }

  async openCreate(): Promise<void> {
    if (!this.access.edit() || this.saving()) return;
    await this.open('new');
  }

  async openEdit(brand: Marca): Promise<void> {
    if (!this.access.edit() || this.saving()) return;
    await this.open(brand);
  }

  private async open(next: Marca | 'new'): Promise<void> {
    if (!await this.confirmDiscard()) return;
    this.formError.set('');
    this.selection.set(next);
  }

  async closeForm(): Promise<void> {
    if (this.saving() || !await this.confirmDiscard()) return;
    this.selection.set(null);
    this.formError.set('');
  }

  private async confirmDiscard(): Promise<boolean> {
    if (!this.form()?.dirty()) return true;
    return firstValueFrom(this.confirmation.confirm({
      title: 'Descartar cambios de marca',
      message: 'Tienes cambios sin guardar. ¿Quieres descartarlos?',
      confirmText: 'Descartar cambios', cancelText: 'Seguir editando', tone: 'danger',
    }));
  }

  canLeave() {
    if (this.saving()) return of(false);
    if (!this.form()?.dirty()) return of(true);
    return this.confirmation.confirm({
      title: 'Descartar cambios de marca',
      message: 'Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?',
      confirmText: 'Descartar cambios', cancelText: 'Seguir editando', tone: 'danger',
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  confirmBrowserExit(event: BeforeUnloadEvent): void {
    if (this.form()?.dirty()) event.preventDefault();
  }

  async save(dto: CrearMarcaDto | EditarMarcaDto): Promise<void> {
    const brand = this.selection();
    if (!this.access.edit() || !brand || this.saving()) return;
    this.formError.set('');
    try {
      if (brand === 'new') {
        await this.createMutation.mutateAsync(dto as CrearMarcaDto);
      } else {
        await this.updateMutation.mutateAsync({ id: brand.id, dto });
      }
      this.selection.set(null);
    } catch (error) {
      this.formError.set(this.message(error, 'No se pudo guardar la marca. Inténtalo de nuevo.'));
    }
  }

  async toggleStatus(brand: Marca): Promise<void> {
    if (!this.access.edit() || this.statusMutation.isPending()) return;
    if (brand.activo && !await firstValueFrom(this.confirmation.confirm({
      title: 'Desactivar marca',
      message: `¿Desactivar ${brand.nombre}? Los productos existentes conservarán su marca.`,
      confirmText: 'Desactivar marca', cancelText: 'Cancelar', tone: 'danger',
    }))) return;
    this.actionError.set('');
    try {
      await this.statusMutation.mutateAsync({ id: brand.id, activo: !brand.activo });
      if (this.status() !== 'todos' && this.query.data()?.items.length === 1 && this.page() > 1) {
        this.page.update((page) => page - 1);
      }
    } catch (error) {
      this.actionError.set(this.message(error, `No se pudo cambiar el estado de ${brand.nombre}.`));
    }
  }

  private message(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const body = (error as { error?: { message?: unknown } }).error;
      if (typeof body?.message === 'string') return body.message;
      if (Array.isArray(body?.message)) return body.message.join('. ');
    }
    return fallback;
  }
}
