import { Component, computed, input, signal } from '@angular/core';
import type { AtributoProducto } from '../../../../../api/interfaces/inventario/producto.interface';
import type {
  CreateVarianteDto,
  VarianteResponse,
} from '../../../../../api/interfaces/inventario/variante.interface';
import { useProductoAtributosApi } from '../../../../actions/use-producto-atributos-action';
import { useVarianteApi } from '../../../../actions/use-variante-action';
import { AtributosSelector } from './atributos-selector';
import { VarianteForm } from './variante-form';

@Component({
  selector: 'variantes-step',
  imports: [AtributosSelector, VarianteForm],
  templateUrl: './variantes-step.html',
  host: { class: 'block' },
})
export class VariantesStep {
  readonly productId = input.required<string>();
  private readonly attributesActions = useProductoAtributosApi(() => this.productId());
  private readonly variantActions = useVarianteApi(() => this.productId());
  readonly attributesQuery = this.attributesActions.attributesQuery;
  readonly variantsQuery = this.variantActions.variantsQuery;
  readonly attributes = computed(() => this.attributesQuery.data() ?? []);
  readonly selectedAttributes = computed(() =>
    this.attributes().filter((attribute) => !!attribute.productoId),
  );
  readonly variants = computed(() => this.variantsQuery.data() ?? []);
  readonly loading = computed(
    () => this.attributesQuery.isPending() || this.variantsQuery.isPending(),
  );
  readonly loadError = computed(
    () => this.attributesQuery.isError() || this.variantsQuery.isError(),
  );
  readonly busy = computed(
    () =>
      this.attributesActions.addAttributeMutation.isPending() ||
      this.attributesActions.removeAttributeMutation.isPending() ||
      this.variantActions.createMutation.isPending(),
  );
  readonly actionError = signal('');
  readonly savedVersion = signal(0);

  retryLoad(): void {
    if (this.attributesQuery.isError()) void this.attributesQuery.refetch();
    if (this.variantsQuery.isError()) void this.variantsQuery.refetch();
  }

  async toggleAttribute(attribute: AtributoProducto): Promise<void> {
    if (this.busy() || this.variants().length) return;
    this.actionError.set('');
    try {
      const id = this.productId();
      if (attribute.productoId)
        await this.attributesActions.removeAttributeMutation.mutateAsync({
          id,
          attributeId: attribute.atributoId,
        });
      else
        await this.attributesActions.addAttributeMutation.mutateAsync({
          id,
          attributeId: attribute.atributoId,
        });
    } catch {
      this.actionError.set('No se pudo actualizar el atributo. Inténtalo de nuevo.');
    }
  }

  async createVariant(dto: CreateVarianteDto): Promise<void> {
    if (this.busy() || !this.selectedAttributes().length) return;
    // Una combinación de valores representa una única variante dentro del producto.
    const key = (values: CreateVarianteDto['valores']) =>
      values
        .map(({ atributoId, valor }) => `${atributoId}:${valor.trim().toLocaleLowerCase()}`)
        .sort()
        .join('|');
    if (this.variants().some((variant) => key(variant.valores) === key(dto.valores))) {
      this.actionError.set('Ya existe una variante con esta combinación de atributos.');
      return;
    }
    this.actionError.set('');
    try {
      await this.variantActions.createMutation.mutateAsync({ id: this.productId(), dto });
      this.savedVersion.update((version) => version + 1);
    } catch {
      this.actionError.set(
        'No se pudo guardar la variante. Revisa si el SKU o código de barras ya existen e inténtalo de nuevo.',
      );
    }
  }

  describe(variant: VarianteResponse): string {
    return variant.valores
      .map(
        ({ atributoId, valor }) =>
          `${this.attributes().find((attribute) => attribute.atributoId === atributoId)?.atributo ?? 'Atributo'}: ${valor}`,
      )
      .join(' · ');
  }
}
