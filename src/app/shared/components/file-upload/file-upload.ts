import {
  Component,
  ElementRef,
  ViewChild,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';

export interface FileUploadRejection {
  file: File;
  reason: 'type' | 'size' | 'count';
  message: string;
}

let nextId = 0;

@Component({
  selector: 'app-file-upload',
  imports: [Icon],
  templateUrl: './file-upload.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FileUpload), multi: true },
  ],
  host: { class: 'block min-w-0' },
})
export class FileUpload implements ControlValueAccessor {
  readonly label = input('Adjuntar archivos');
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly maxFileSize = input(10 * 1024 * 1024, { transform: numberAttribute });
  readonly maxFiles = input(10, { transform: numberAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly filesChange = output<File[]>();
  readonly filesRejected = output<FileUploadRejection[]>();
  readonly files = signal<File[]>([]);
  readonly errors = signal<FileUploadRejection[]>([]);
  readonly formDisabled = signal(false);
  readonly dragging = signal(false);
  readonly id = `file-upload-${nextId++}`;
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly limit = computed(() => this.multiple() ? Math.max(1, Math.floor(this.maxFiles()) || 1) : 1);
  readonly totalSize = computed(() => this.files().reduce((size, file) => size + file.size, 0));
  readonly rules = computed(() => {
    const type = this.accept().trim() || 'Todos los formatos';
    return `${type} · Hasta ${this.formatSize(this.maxFileSize())} por archivo${this.multiple() ? ` · Máximo ${this.limit()} archivos` : ''}`;
  });

  @ViewChild('choose', { read: ElementRef }) private choose?: ElementRef<HTMLButtonElement>;
  private dragDepth = 0;
  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: File[] | null): void {
    this.files.set(value ? [...value] : []);
    this.errors.set([]);
  }

  registerOnChange(fn: (value: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) this.resetDrag();
  }

  onBlur(event: FocusEvent): void {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) this.onTouched();
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (this.isDisabled() || !event.dataTransfer?.types.includes('Files')) return;
    this.dragDepth++;
    this.dragging.set(true);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = this.isDisabled() ? 'none' : 'copy';
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (!this.dragDepth) this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.resetDrag();
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  addFiles(incoming: readonly File[]): void {
    if (this.isDisabled() || !incoming.length) return;
    this.onTouched();
    const next = this.multiple() ? [...this.files()] : [];
    const rejected: FileUploadRejection[] = [];
    let accepted = false;
    for (const file of incoming) {
      let reason: FileUploadRejection['reason'] | undefined;
      let message = '';
      if (!this.accepts(file)) {
        reason = 'type';
        message = `${file.name}: el formato no está permitido.`;
      } else if (file.size > this.maxFileSize()) {
        reason = 'size';
        message = `${file.name}: supera el límite de ${this.formatSize(this.maxFileSize())}.`;
      } else if (next.some((item) => this.sameFile(item, file))) {
        continue;
      } else if (next.length >= this.limit()) {
        reason = 'count';
        message = `${file.name}: puedes seleccionar hasta ${this.limit()} ${this.limit() === 1 ? 'archivo' : 'archivos'}.`;
      }
      if (reason) {
        rejected.push({ file, reason, message });
      } else {
        next.push(file);
        accepted = true;
      }
    }
    this.errors.set(rejected);
    if (rejected.length) this.filesRejected.emit(rejected);
    if (accepted) this.update(next);
  }

  remove(index: number): void {
    if (this.isDisabled()) return;
    this.update(this.files().filter((_, position) => position !== index));
    this.errors.set([]);
    this.onTouched();
    this.choose?.nativeElement.focus();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('es', { maximumFractionDigits: 1 })} KB`;
    return `${(bytes / (1024 * 1024)).toLocaleString('es', { maximumFractionDigits: 1 })} MB`;
  }

  private accepts(file: File): boolean {
    const tokens = this.accept().split(',').map((token) => token.trim().toLowerCase()).filter(Boolean);
    return !tokens.length || tokens.some((token) => {
      if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
      if (token.endsWith('/*')) return file.type.toLowerCase().startsWith(token.slice(0, -1));
      return file.type.toLowerCase() === token;
    });
  }

  private sameFile(a: File, b: File): boolean {
    return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified && a.type === b.type;
  }

  private update(files: File[]): void {
    this.files.set(files);
    this.onChange([...files]);
    this.filesChange.emit([...files]);
  }

  private resetDrag(): void {
    this.dragDepth = 0;
    this.dragging.set(false);
  }
}
