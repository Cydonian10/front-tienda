# Tooltip

Directiva standalone con el tooltip CSS de daisyUI 5 y descripciones accesibles de CDK A11y. Sin Overlay ni contenedor global.

Importa `Tooltip` desde `shared/directives/tooltip/tooltip` en el arreglo `imports` del componente consumidor:

```html
<button
  type="button"
  class="btn"
  appTooltip="Guardar los cambios del producto"
  tooltipPosition="bottom"
>
  Guardar
</button>
```

## API

| Input             | Valor predeterminado | Descripción                                                                     |
| ----------------- | -------------------- | ------------------------------------------------------------------------------- |
| `appTooltip`      | `''`                 | Texto; acepta `null` y `undefined`. Vacío o solo espacios desactiva el tooltip. |
| `tooltipPosition` | `'top'`              | `'top'`, `'bottom'`, `'left'` o `'right'`.                                      |
| `tooltipDisabled` | `false`              | Desactiva el tooltip visual y su descripción accesible.                         |

Se muestra al pasar el puntero o enfocar con teclado. Un clic (también la activación con teclado de un botón nativo) o Escape lo oculta hasta una nueva entrada del puntero o del foco, sin mover el foco ni bloquear el evento. El texto se renderiza sin interpretar HTML; los colores y el movimiento reducido pertenecen a daisyUI y al tema activo.

CDK administra una descripción oculta con `role="tooltip"`, enlazada por `aria-describedby`, conserva otras descripciones y la elimina al cambiar el texto o destruir la directiva. No sustituye `aria-label`: los botones de solo icono deben tener su propio nombre accesible.

## Controles deshabilitados

Un botón nativo deshabilitado no recibe foco. Si su explicación debe estar disponible mediante teclado, aplica la directiva a un contenedor enfocable:

```html
<span
  tabindex="0"
  aria-label="Guardar no disponible"
  appTooltip="Completa los campos obligatorios para guardar"
>
  <button type="button" class="btn" disabled>Guardar</button>
</span>
```

## Límites

- Solo texto breve y complementario; sin enlaces, botones ni información imprescindible. En móvil ofrece también texto visible: no dependas del hover.
- daisyUI utiliza pseudoelementos y posicionamiento relativo: puede modificar un host con layout especial y puede quedar recortado por `overflow: hidden/auto`. En estos casos usa un contenedor compatible o una implementación específica con CDK Overlay.
- No reposiciona automáticamente al llegar al borde de pantalla. Elige una posición adecuada.
- No combines la directiva con clases `tooltip*`, `data-tip` o `title` manuales en el mismo elemento.
