import { Component, computed, input } from '@angular/core';
import type { ProductResponse } from '../../../../../api/interfaces/inventario/producto.interface';
import type { VarianteResponse } from '../../../../../api/interfaces/inventario/variante.interface';
import { useProductoAtributosApi } from '../../../../actions/use-producto-atributos-action';
import { useVarianteApi } from '../../../../actions/use-variante-action';
import { useProductoUnidadesApi } from '../../../../actions/use-producto-unidades-action';
import type { UnidadProductoResponse } from '../../../../../api/interfaces/inventario/unidad-producto.interface';

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
  private readonly unitActions = useProductoUnidadesApi(() => this.product().id);
  private readonly unitsQuery = this.unitActions.assignmentsQuery;
  private readonly catalogQuery = this.unitActions.catalogQuery;
  readonly units = computed(() => this.unitsQuery.data() ?? []);
  readonly catalog = computed(() => this.catalogQuery.data() ?? []);
  readonly baseUnit = computed(() =>
    this.catalog().find((unit) => unit.id === this.product().unidadBaseId),
  );
  readonly unitsLoading = computed(
    () => this.unitsQuery.isPending() || this.catalogQuery.isPending(),
  );
  readonly unitsError = computed(() => this.unitsQuery.isError() || this.catalogQuery.isError());
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

  retryUnits(): void {
    if (this.unitsQuery.isError()) void this.unitsQuery.refetch();
    if (this.catalogQuery.isError()) void this.catalogQuery.refetch();
  }

  unitName(item: UnidadProductoResponse): string {
    const unit = this.catalog().find((entry) => entry.id === item.unidadId);
    return unit ? `${unit.nombre} (${unit.simbolo})` : item.unidadId;
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
