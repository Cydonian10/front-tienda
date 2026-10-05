# Empty state

Importa `EmptyState` en los `imports` del consumidor.

```html
<app-empty-state
  variant="no-results"
  title="No hay proveedores con estos filtros"
  actionLabel="Limpiar filtros"
  (action)="clearFilters()"
/>
```

Para un primer uso, utiliza `variant="empty"` y una acción concreta como “Agregar proveedor”. Para un fallo utiliza `variant="error"`, `actionLabel="Reintentar"` y conecta `(action)` a la petición. El componente no realiza operaciones por sí mismo.

- `variant`: `empty` (predeterminado), `no-results` o `error`; cada variante proporciona título, descripción e icono.
- `title`, `description`, `icon`: personalizan los valores de la variante. `description=""` oculta la descripción.
- `actionLabel`: sin valor por defecto; el botón solo aparece si hay texto.
- `actionDisabled`: desactiva la acción.
- `compact`: reduce el espacio vertical para superficies pequeñas.
- `(action)`: emite `void` al pulsar el botón habilitado.

Usa `input()`, `computed()` y `output()`, colores semánticos de daisyUI e iconos del proyecto. El botón ocupa el ancho disponible en móvil y tiene al menos 44 px de alto. Mensajes y nombres largos se ajustan sin desbordar. El consumidor controla cuándo mostrarlo; no se usa `role="alert"` para anunciar estados vacíos ordinarios ni se mueve el foco automáticamente.
