# Icon

Componente standalone `<app-icon>` que centraliza los 15 SVG actuales del proyecto. Sin dependencias nuevas ni HTML/SVG recibido dinámicamente.

```ts
import { Icon } from './shared/components/icon/icon';
// Añadir Icon a los imports del componente consumidor.
```

```html
<app-icon name="users" />
<app-icon name="settings" color="primary" [size]="24" />
<app-icon name="check" color="success" size="32" strokeWidth="2.5" />
<app-icon name="warning" color="#b45309" label="Hay advertencias" />
<app-icon name="close" class="text-error" [size]="16" />
```

- `name`: obligatorio, tipado como `IconName`.
- `color`: por defecto `currentColor`, hereda el color del texto. Admite colores semánticos de daisyUI o cualquier color CSS válido.
- `size`: por defecto `20`; ancho y alto en píxeles, como número o atributo numérico.
- `strokeWidth`: por defecto `1.7`; grosor del trazo SVG.
- `label`: por defecto vacío; nombre accesible. Sin él, el icono es decorativo.

Colores semánticos: `primary`, `secondary`, `accent`, `neutral`, `success`, `error`, `warning`, `info` y sus variantes `*-content`; también `base-100`, `base-200`, `base-300` y `base-content`. Se resuelven con variables CSS y siguen el tema global o los tokens locales del sidebar. Los colores CSS fijos no cambian con el tema. También se pueden usar clases `text-*` cuando `color` conserva `currentColor`.

Iconos disponibles: `menu`, `close`, `chevron-down`, `chevron-right`, `check`, `settings`, `shield`, `shield-check`, `users`, `sun`, `moon`, `success`, `error`, `warning`, `info`.

El menú, la cabecera, el selector de tema, el select y los toasts ya consumen este componente. Para agregar un icono, añade su geometría de `path`/`circle` en `icons.ts`, manteniendo el `viewBox` de 24×24. `IconName` se actualiza automáticamente. No registres geometría recibida de usuarios o APIs.

El icono no es un botón: ponlo dentro de un control con su propio nombre accesible cuando represente una acción. No hace falta `label` si el control ya está etiquetado. Tamaños y trazos inválidos vuelven a sus valores predeterminados; un nombre desconocido en tiempo de ejecución no dibuja geometría.
