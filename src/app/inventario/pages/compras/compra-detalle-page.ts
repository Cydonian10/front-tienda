import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CompraApi } from '../../../api/inventario/compra-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { usePermissions } from '../../../auth/services/use-permissions';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import {
  FileUpload,
  type FileUploadRejection,
} from '../../../shared/components/file-upload/file-upload';
import { useAdjuntarComprobante, useCompraDetalle } from '../../actions/use-compras-action';
import { documentoCompra, formatTotalPEN } from './compra-form.model';
import { comprobanteError } from './comprobante-validation';
import { EditarCompra } from './components/editar-compra';

function safeFilename(name: string): string {
  return (
    name
      .split(/[\\/]/)
      .pop()
      ?.replace(/[\x00-\x1f\x7f]/g, '') || 'comprobante'
  );
}

@Component({
  selector: 'app-compra-detalle-page',
  imports: [RouterLink, EmptyState, FileUpload, DatePipe, EditarCompra],
  templateUrl: './compra-detalle-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export default class CompraDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CompraApi);
  private readonly authorization = inject(AuthorizationService);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly compraId = computed(() => this.params().get('id') ?? '');
  readonly permissions = usePermissions('INVENTARIO', {
    read: PERMISSION_CODES.COMPRAS_READ,
    create: PERMISSION_CODES.COMPRAS_CREATE,
    update: PERMISSION_CODES.COMPRAS_UPDATE,
  });
  readonly query = useCompraDetalle(this.compraId);
  readonly notFound = computed(() => {
    const error = this.query.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  readonly attachMutation = useAdjuntarComprobante();
  readonly uploadedForId = signal<string | null>(null);
  readonly comprobante = computed(
    () =>
      this.query.data()?.comprobante ??
      (this.uploadedForId() === this.compraId() ? this.attachMutation.data() : null),
  );
  readonly file = signal<File | null>(null);
  readonly fileError = signal('');
  readonly uploadError = signal('');
  readonly downloadError = signal('');
  readonly uploading = signal(false);
  readonly downloading = signal(false);
  readonly editing = signal(false);
  readonly editSaved = signal(false);
  readonly money = formatTotalPEN;
  readonly documento = documentoCompra;
  @ViewChild(FileUpload) private fileUpload?: FileUpload;

  startEdit(): void {
    if (
      !this.query.data() ||
      !this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.COMPRAS_UPDATE)
    )
      return;
    this.editSaved.set(false);
    this.editing.set(true);
  }

  finishEdit(): void {
    this.editing.set(false);
    this.editSaved.set(true);
  }

  refreshEdit(): void {
    this.editing.set(false);
    void this.query.refetch();
  }

  onFilesChange(files: File[]): void {
    const file = files[0] ?? null;
    const error = file ? comprobanteError(file) : null;
    if (error) {
      this.file.set(null);
      this.fileUpload?.writeValue(null);
      this.fileError.set(error);
      return;
    }
    this.file.set(file);
    if (!file || !this.fileUpload?.errors().length) this.fileError.set('');
  }

  onFilesRejected(rejected: FileUploadRejection[]): void {
    this.fileError.set(rejected.map(({ message }) => message).join(' '));
  }

  async attach(): Promise<void> {
    const id = this.compraId();
    const file = this.file();
    if (!id || !file || !this.query.data() || this.comprobante() || this.uploading()) return;
    if (!this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.COMPRAS_CREATE)) {
      this.uploadError.set('No tienes permiso para adjuntar un comprobante.');
      return;
    }
    const error = comprobanteError(file);
    if (error) {
      this.fileError.set(error);
      return;
    }
    this.uploadError.set('');
    this.uploading.set(true);
    try {
      await this.attachMutation.mutateAsync({ id, file });
      this.uploadedForId.set(id);
      this.file.set(null);
    } catch (cause) {
      if (cause instanceof HttpErrorResponse && cause.status === 409) {
        this.uploadError.set(
          'Ya existe un comprobante para esta compra. Actualiza el detalle para consultarlo; no se reemplazó ningún archivo.',
        );
        await this.query.refetch();
      } else {
        this.uploadError.set(
          'No se pudo confirmar la subida. La compra y el ingreso siguen guardados. Actualiza el detalle para comprobar si el archivo quedó adjunto antes de reintentar.',
        );
      }
    } finally {
      this.uploading.set(false);
    }
  }

  async download(): Promise<void> {
    const id = this.compraId();
    const metadata = this.comprobante();
    if (!id || !metadata || this.downloading()) return;
    if (!this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.COMPRAS_READ)) {
      this.downloadError.set('No tienes permiso para descargar este comprobante.');
      return;
    }
    this.downloadError.set('');
    this.downloading.set(true);
    let url: string | null = null;
    try {
      const blob = await this.api.downloadComprobante(id);
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFilename(metadata.nombreOriginal);
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch {
      this.downloadError.set('No se pudo descargar el comprobante. Inténtalo de nuevo.');
    } finally {
      if (url) {
        const objectUrl = url;
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      }
      this.downloading.set(false);
    }
  }
}
