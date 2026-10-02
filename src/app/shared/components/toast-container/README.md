# Notificaciones globales

`ToastContainer` está montado una sola vez en `src/app/app.html`. No hace falta añadirlo a cada página ni instalar dependencias. Usa las clases `toast` y `alert` de daisyUI y los tokens del tema existente.

## Uso desde cualquier componente o servicio

```ts
import { inject } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';

private readonly toast = inject(ToastService);

guardar(): void {
  // Mostrar después de que la operación realmente haya terminado.
  this.toast.success('Los cambios se guardaron correctamente.', {
    title: 'Producto actualizado',
  });
}
```

```ts
this.toast.error('Revisa tu conexión e intenta nuevamente.');
this.toast.warning('Completa los campos obligatorios.', { duration: 8000 });
this.toast.info('La exportación está en proceso.', { title: 'Exportación', duration: 0 });

// Todos los métodos devuelven el identificador de la notificación.
const id = this.toast.info('Preparando archivo...', { duration: 0 });
this.toast.dismiss(id);
this.toast.clear(); // Descarta también los mensajes en cola.
```

## Comportamiento

- Arriba a la derecha; ancho adaptable en móvil y respeto de las áreas seguras.
- Máximo de tres notificaciones visibles. Las siguientes esperan en cola; su duración empieza al mostrarse.
- Éxito, información y advertencia duran 5000 ms por defecto. Los errores permanecen hasta cerrarse. `duration: 0` hace persistente cualquier tipo.
- Pausa el tiempo restante al pasar el cursor, al enfocar la notificación o al ocultar la pestaña.
- Cierre con botón o Escape cuando el foco está dentro. No roba el foco al aparecer.
- Lectores de pantalla: anuncios educados para avisos normales e inmediatos para errores; movimiento reducido respetado.
- SSR: no renderiza mensajes transitorios ni programa temporizadores.
- Mensajes y títulos son texto plano, nunca HTML.

No uses los toasts como único lugar para errores de validación: los campos deben conservar sus mensajes asociados. Mantén los textos breves y explica cómo recuperarse de un error.
