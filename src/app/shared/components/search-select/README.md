# SearchSelect

Selector buscable con CDK Overlay. `options` recibe objetos directamente: `valueKey` define la propiedad del valor (por defecto `value`) y `labelKey` la del texto (por defecto `label`). Los valores deben ser `string` o `number` y únicos; una propiedad de valor inexistente o de otro tipo genera un error de configuración. La propiedad opcional `disabled: true` deshabilita esa opción. Por defecto selecciona un solo valor; con `multiple` entrega un arreglo. `visibleItems` limita la altura de la lista (por defecto 5 filas); el resto se puede recorrer con scroll. El filtro busca por la propiedad indicada en `labelKey`, sin distinguir mayúsculas/minúsculas.

```ts
import { SearchSelect, SearchSelectOption } from './shared/components/search-select/search-select';

readonly products: SearchSelectOption[] = [
  { value: 1, label: 'Martillo' },
  { value: 2, label: 'Taladro' },
];
// Añadir SearchSelect a `imports` del componente consumidor.
```

```html
<app-search-select
  [options]="products"
  placeholder="Producto"
  [visibleItems]="4"
  (selectionChange)="onProductChange($event)"
/>
<app-search-select
  [options]="products"
  [multiple]="true"
  [visibleItems]="6"
  [formControl]="productIds"
/>
```

## Objetos con otros nombres de propiedades

No es necesario transformar los datos a `{ value, label }`:

```ts
readonly products = [
  { productId: 1, nombre: 'Martillo' },
  { productId: 2, nombre: 'Taladro', disabled: true },
];
```

```html
<app-search-select
  [options]="products"
  valueKey="productId"
  labelKey="nombre"
  [multiple]="true"
  [visibleItems]="6"
  [formControl]="productIds"
/>
```

Para objetos `{ id, descripcion }`, usar `valueKey="id"` y `labelKey="descripcion"`. Tanto el formulario como `selectionChange` reciben los identificadores, no los objetos completos. Los datos originales no se modifican.

Compatible con `formControl`, `formControlName` y `ngModel` mediante `ControlValueAccessor` (importar `ReactiveFormsModule` o `FormsModule` en el consumidor). El valor simple es `string | number | null`; el múltiple es `(string | number)[]`. También admite `disabled`, `searchPlaceholder` y `placeholder` como inputs.
