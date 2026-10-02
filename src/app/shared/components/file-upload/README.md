# File upload

Selector standalone con drag and drop, selección nativa y estilos daisyUI. Importa `FileUpload` en los `imports` del consumidor.

```html
<app-file-upload
  label="Documentos del proveedor"
  accept=".pdf,.docx,image/*"
  multiple
  [maxFiles]="5"
  [maxFileSize]="10 * 1024 * 1024"
  (filesChange)="onFilesSelected($event)"
  (filesRejected)="onFilesRejected($event)"
/>
```

También admite `formControl`, `formControlName` y `ngModel` mediante `ControlValueAccessor`. Su valor siempre es `File[]`, incluso en selección simple; `null` reinicia la selección. No emite cambios al escribir el valor desde un formulario.

| Input | Default | Descripción |
| --- | --- | --- |
| `label` | `Adjuntar archivos` | Nombre de la sección. |
| `accept` | `''` | Extensiones, MIME o familias (`image/*`), separados por comas. Vacío permite todos. |
| `multiple` | `false` | Acumula archivos; en modo simple una selección válida reemplaza la anterior. |
| `maxFiles` | `10` | Máximo en modo múltiple, mínimo efectivo 1. Usa un entero positivo. |
| `maxFileSize` | `10485760` | Bytes por archivo (10 MB). Usa un número positivo. |
| `disabled` | `false` | Bloquea selección, arrastre y eliminación; también respeta el estado del formulario. |

`filesChange` entrega `File[]`; `filesRejected` entrega `{ file, reason, message }[]` con motivos `type`, `size` o `count`. Los archivos válidos de una selección mixta se conservan y los rechazados se explican. Los duplicados por nombre, tamaño, fecha y MIME se ignoran. Una selección totalmente inválida no borra los archivos existentes.

La validación se aplica al agregar archivos, no a valores escritos desde el formulario ni retroactivamente al cambiar la configuración. Los rechazos no invalidan el formulario: para exigir selección usa un validador en el consumidor.

El componente **no sube archivos** ni inventa progreso: muestra “Pendientes de envío”. El consumidor puede enviarlos con `FormData` a su API. Valida siempre tamaño y contenido en el servidor; `accept` y el MIME del navegador no son garantías de seguridad. En archivos con MIME vacío usa extensiones en `accept`.

Incluye alternativa por botón para teclado y móvil, avisos accesibles, soporte para temas `light`/`ferreteria` y movimiento reducido. No genera URLs ni lee el contenido de los archivos. Arrastrar carpetas no está soportado.
