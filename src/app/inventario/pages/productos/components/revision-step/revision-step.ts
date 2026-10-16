import { Component, computed, input } from '@angular/core';
import type { ProductResponse } from '../../../../../api/interfaces/inventario/producto.interface';
import type { VarianteResponse } from '../../../../../api/interfaces/inventario/variante.interface';
import { useProductoAtributosApi } from '../../../../actions/use-producto-atributos-action';
import { useVarianteApi } from '../../../../actions/use-variante-action';

@Component({
  selector: 'revision-step',
  templateUrl: './revision-step.html',
  host: { class: 'block' },
})
export class RevisionStep {
  readonly product = input.required<ProductResponse>();
  private readonly attributesQuery = useProductoAtributosApi(() => this.product().id)
    .attributesQuery;
  private readonly variantsQuery = useVarianteApi(() => this.product().id).variantsQuery;
  readonly variants = computed(() => this.variantsQuery.data() ?? []);
  readonly attributes = computed(() => this.attributesQuery.data() ?? []);
  readonly loading = computed(
    () => this.variantsQuery.isPending() || this.attributesQuery.isPending(),
  );
  readonly error = computed(() => this.variantsQuery.isError() || this.attributesQuery.isError());

  retryLoad(): void {
    if (this.variantsQuery.isError()) void this.variantsQuery.refetch();
    if (this.attributesQuery.isError()) void this.attributesQuery.refetch();
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
