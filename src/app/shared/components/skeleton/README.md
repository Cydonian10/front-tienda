# Skeleton

Importa `Skeleton` en los `imports` del consumidor. Usa el skeleton solamente mientras se carga el contenido; procura elegir una variante que se parezca a la estructura final para reducir saltos de layout.

```html
@if (loading()) {
  <app-skeleton variant="list" [count]="5" label="Cargando proveedores…" />
} @else {
  <!-- Contenido cargado -->
}
```

- `variant`: `text` (predeterminado), `list` o `cards`.
- `count`: líneas, filas o tarjetas; predeterminado 3, limitado entre 1 y 20. Valores no finitos usan 3.
- `label`: mensaje accesible, predeterminado “Cargando contenido…”.
- `animated`: predeterminado `true`; desactiva con `[animated]="false"`. También respeta `prefers-reduced-motion`.

Implementado con `input()` y `computed()`. Un único `role="status"` anuncia la carga; las formas decorativas están ocultas a lectores de pantalla. No crea temporizadores ni controla peticiones. Puedes poner `aria-busy` en la región de contenido del consumidor. Las tarjetas usan una columna en móvil, dos desde `sm` y tres desde `lg`.
