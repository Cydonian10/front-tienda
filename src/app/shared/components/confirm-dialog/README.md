# Confirm dialog

Confirmación reutilizable con `Dialog` de Angular CDK, sin Angular Material. No requiere agregar un contenedor al layout ni importar el componente en cada página.

```ts
import { inject } from '@angular/core';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

private readonly confirmation = inject(ConfirmDialogService);

deleteProduct(): void {
  this.confirmation.confirm({
    title: '¿Eliminar este producto?',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar producto',
    tone: 'danger',
  }).subscribe((confirmed) => {
    if (!confirmed) return;
    // Ejecutar aquí la eliminación, no antes de confirmar.
  });
}
```

- `title` y `message` son obligatorios y se renderizan como texto, no HTML.
- `confirmText` y `cancelText` son opcionales; por defecto: “Confirmar” y “Cancelar”.
- `tone`: `default` (primario) o `danger` (error). Los colores heredan el tema global activo.
- Abre inmediatamente y devuelve un `Observable<boolean>` que emite una vez al cerrar y se completa. Confirmar devuelve `true`; cancelar, Escape, clic fuera y cierre por navegación de historial devuelven `false`.
- CDK gestiona el bloqueo de scroll, el foco atrapado y la devolución del foco al disparador. El foco inicial está en “Cancelar”.
- Durante SSR devuelve `false` sin crear un overlay.
- El diálogo solo solicita confirmación: llamadas HTTP, carga y errores corresponden al consumidor.
