import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, ElementRef, ViewChild, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SearchSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

let nextId = 0;

@Component({
  selector: 'app-search-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelect),
      multi: true,
    },
  ],
  templateUrl: './search-select.html',
  host: { class: 'block min-w-0' },
})
export class SearchSelect<T extends object = SearchSelectOption> implements ControlValueAccessor {
  readonly options = input.required<readonly T[]>();
  /** Object property used as the selected value (string or number). */
  readonly valueKey = input('value');
  /** Object property used for display and search. */
  readonly labelKey = input('label');
  readonly multiple = input(false);
  /** Maximum number of rows visible before the options list scrolls. */
  readonly visibleItems = input(5);
  readonly placeholder = input('Seleccionar...');
  readonly searchPlaceholder = input('Buscar...');
  readonly disabled = input(false);
  readonly selectionChange = output<string | number | (string | number)[] | null>();

  readonly id = `search-select-${nextId++}`;
  readonly opened = signal(false);
  readonly query = signal('');
  readonly selected = signal<(string | number)[]>([]);
  readonly formDisabled = signal(false);
  readonly activeIndex = signal(-1);
  readonly overlayWidth = signal(0);

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private readonly normalizedOptions = computed<SearchSelectOption[]>(() => {
    const valueKey = this.valueKey();
    const labelKey = this.labelKey();
    return this.options().map((option) => {
      const record = option as Record<string, unknown>;
      const value = record[valueKey];
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(`SearchSelect: "${valueKey}" must contain a string or number.`);
      }
      return {
        value,
        label: String(record[labelKey] ?? ''),
        disabled: record['disabled'] === true,
      };
    });
  });
  readonly filteredOptions = computed(() => {
    const term = this.query().trim().toLocaleLowerCase();
    return this.normalizedOptions().filter((option) => option.label.toLocaleLowerCase().includes(term));
  });
  readonly displayValue = computed(() => {
    const selected = this.selected();
    const labels = this.normalizedOptions()
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);
    return this.multiple() ? labels.join(', ') : (labels[0] ?? '');
  });
  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  @ViewChild('trigger', { read: ElementRef }) private trigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('search', { read: ElementRef }) private search?: ElementRef<HTMLInputElement>;

  private onChange: (value: string | number | (string | number)[] | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | number | (string | number)[] | null): void {
    this.selected.set(Array.isArray(value) ? [...value] : value == null ? [] : [value]);
  }

  registerOnChange(fn: typeof this.onChange): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) this.close();
  }

  toggle(): void {
    if (this.isDisabled()) return;
    if (this.opened()) {
      this.close();
      return;
    }
    this.overlayWidth.set(this.trigger?.nativeElement.getBoundingClientRect().width ?? 0);
    this.query.set('');
    this.activeIndex.set(this.filteredOptions().findIndex((option) => !option.disabled));
    this.opened.set(true);
  }

  focusSearch(): void {
    queueMicrotask(() => this.search?.nativeElement.focus());
  }

  close(): void {
    if (!this.opened()) return;
    this.opened.set(false);
    this.onTouched();
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.activeIndex.set(this.filteredOptions().findIndex((option) => !option.disabled));
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.trigger?.nativeElement.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!options.length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      let next = this.activeIndex();
      for (let i = 0; i < options.length; i++) {
        next = (next + direction + options.length) % options.length;
        if (!options[next].disabled) {
          this.activeIndex.set(next);
          document.getElementById(`${this.id}-option-${next}`)?.scrollIntoView({ block: 'nearest' });
          break;
        }
      }
    } else if (event.key === 'Enter' && this.activeIndex() >= 0) {
      event.preventDefault();
      this.choose(options[this.activeIndex()]);
    }
  }

  choose(option: SearchSelectOption): void {
    if (this.isDisabled() || option.disabled) return;
    if (this.multiple()) {
      const current = this.selected();
      const next = current.includes(option.value)
        ? current.filter((value) => value !== option.value)
        : [...current, option.value];
      this.selected.set(next);
      this.onChange(next);
      this.selectionChange.emit(next);
    } else {
      this.selected.set([option.value]);
      this.onChange(option.value);
      this.selectionChange.emit(option.value);
      this.close();
      this.trigger?.nativeElement.focus();
    }
  }

  /** Options area height, excluding the search field. */
  get maxListHeight(): number {
    return Math.max(1, Math.floor(this.visibleItems())) * 40;
  }
}
