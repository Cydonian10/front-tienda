# SPEC 07 — Visor ampliado de imágenes de producto

> **Status:** Aprobado
> **Depends on:** SPEC 03 (subida de imágenes de producto)
> **Date:** 2026-09-05
> **Objective:** Permitir abrir en un diálogo la imagen de una miniatura del flujo de imágenes de producto mediante una transición compartida suave y accesible.

## Scope

**In:**

- Convertir la miniatura renderizada por `ProductImagesUpload` en un control accesible que se pueda activar con clic, Enter o Espacio.
- Abrir el visor para cualquier elemento que tenga `previewUrl`, incluyendo imágenes nuevas, pendientes, subiendo, cargadas y ya guardadas.
- Crear el componente reutilizable `ImagePreviewDialog` en `src/app/shared/image-preview-dialog/image-preview-dialog.ts` y `image-preview-dialog.html`.
- Abrir el visor mediante el `Dialog` de `@angular/cdk/dialog`, reutilizando la infraestructura existente.
- Mostrar la imagen ampliada completa dentro del espacio disponible del viewport, conservando su proporción mediante `object-contain`.
- Mostrar un botón accesible **Cerrar**, cerrar también con Escape y permitir el cierre al pulsar el backdrop.
- Aplicar una transición compartida entre la miniatura activa y la imagen ampliada, junto con una aparición suave del backdrop.
- Activar la View Transition API únicamente durante la apertura y el cierre del visor, sin modificar las transiciones globales del router.
- Añadir un fallback CSS cuando `document.startViewTransition` no esté disponible.
- Respetar `prefers-reduced-motion` desactivando el movimiento no esencial.
- Mostrar un estado de error dentro del visor si la imagen no puede cargarse, manteniendo disponible el botón **Cerrar**.
- Mantener independientes la previsualización y las operaciones de subir, marcar como principal o eliminar una imagen.
- Añadir las pruebas unitarias necesarias para el diálogo y para la emisión de apertura desde la miniatura.

**Out of scope (specs futuros):**

- Cambios en el modelo `Image`, en `ImageUpload` o en los endpoints de `ImagesService`.
- Descarga, reemplazo, edición, recorte o rotación de imágenes.
- Galería con navegación entre varias imágenes, zoom adicional o gestos táctiles.
- Cambios al flujo de selección, validación, subida, reintento, eliminación o selección de imagen principal.
- Transiciones de navegación entre rutas o una configuración global de `withViewTransitions`.
- Persistencia de la imagen ampliada, de la última imagen abierta o de preferencias de animación.

## Data model

```ts
// src/app/shared/image-preview-dialog/image-preview-dialog.ts
export interface ImagePreviewDialogData {
  src: string;
  alt: string;
}
```

El diálogo no introduce persistencia ni modifica los modelos de imágenes existentes. Recibe únicamente la URL de previsualización y el texto alternativo ya disponibles en `ImageUpload`.

Convenciones:

- La miniatura activa y la imagen del diálogo comparten un nombre de transición único basado en el identificador local de `ImageUpload`.
- Solo puede existir un visor abierto a la vez.
- El foco vuelve al control de miniatura que abrió el visor después de cerrarlo.
- Si la View Transition API no existe, el diálogo sigue funcionando con la transición CSS de fallback.
- Si `prefers-reduced-motion: reduce` está activo, la apertura y el cierre no aplican escalado ni desplazamiento.
- Un error de carga no elimina ni modifica el `ImageUpload` original.

## Implementation plan

1. Crear `src/app/shared/image-preview-dialog/image-preview-dialog.ts` con `ImagePreviewDialogData`, la lectura de `DIALOG_DATA`, el `DialogRef` y las acciones de cierre; crear su plantilla con imagen contenida, estado de error y botón **Cerrar**.
2. Añadir `openImagePreviewDialog` en el mismo módulo compartido para abrir `ImagePreviewDialog` con `Dialog`, permitir cierre por backdrop y Escape, y conservar la referencia necesaria para restaurar el foco.
3. Modificar `product-image-upload.component.ts` y `product-image-upload.component.html` para emitir `previewRequested` y representar la miniatura como botón accesible, conservando las acciones actuales de principal y eliminación.
4. Modificar `product-images.page.ts` para recibir la solicitud, guardar temporalmente el identificador de la miniatura activa, abrir el diálogo con `previewUrl` y el texto alternativo correspondiente, y limpiar ese estado al cerrar sin interferir con las operaciones existentes.
5. Añadir las reglas globales de transición en `src/app/app.css` para la imagen compartida, el backdrop, el fallback CSS y `prefers-reduced-motion`; envolver únicamente la apertura y el cierre del diálogo con `document.startViewTransition` cuando esté disponible.
6. Añadir `image-preview-dialog.spec.ts` y la cobertura del componente `ProductImagesUpload` para verificar los datos recibidos, clic, teclado, cierres, error de carga y fallback de la transición.
7. Verificar con `npm run build` y `npm test` en `FrontTienda`, y comprobar manualmente la apertura, cierre, foco, imagen rota y comportamiento responsive en desktop y móvil.

## Acceptance criteria

- [ ] Al pulsar una miniatura con `previewUrl`, se abre el visor ampliado mediante CDK Dialog.
- [ ] La miniatura puede activar el visor con Enter y Espacio además del clic.
- [ ] El visor muestra la imagen completa sin recortarla y conserva su proporción.
- [ ] El texto alternativo del visor coincide con el texto alternativo generado para la miniatura.
- [ ] El visor muestra un botón accesible **Cerrar**.
- [ ] El botón **Cerrar** cierra el visor.
- [ ] Escape cierra el visor.
- [ ] Pulsar el backdrop cierra el visor.
- [ ] El foco vuelve a la miniatura que abrió el visor después del cierre.
- [ ] Se puede abrir la previsualización para imágenes nuevas y guardadas cuando tienen `previewUrl`.
- [ ] La apertura y el cierre usan una transición compartida entre la miniatura activa y la imagen ampliada.
- [ ] La transición del backdrop aparece y desaparece suavemente.
- [ ] La View Transition API se usa solo para la apertura y el cierre del visor, sin configurar transiciones globales del router.
- [ ] En navegadores sin View Transition API, el visor funciona usando el fallback CSS.
- [ ] Con `prefers-reduced-motion: reduce`, no se aplica movimiento no esencial.
- [ ] Si la imagen no carga, el visor muestra un mensaje de error y conserva el botón **Cerrar**.
- [ ] Abrir el visor no cambia el estado de subida, progreso, error, imagen principal ni eliminación del `ImageUpload`.
- [ ] `npm run build` y `npm test` pasan sin errores en `FrontTienda`.

## Decisions

- **Sí:** limitar la apertura al componente `ProductImagesUpload`, porque el requerimiento se refiere a las miniaturas del flujo actual y no al selector de archivos.
- **Sí:** usar un componente `ImagePreviewDialog` en `src/app/shared`, porque el visor puede reutilizarse en otros flujos de imágenes.
- **Sí:** reutilizar `@angular/cdk/dialog`, porque la aplicación ya usa CDK Dialog para confirmaciones y formularios modales.
- **Sí:** usar `document.startViewTransition` solo para el visor, porque la solicitud se limita a la ampliación de imágenes y no debe cambiar la navegación global.
- **Sí:** vincular visualmente la miniatura activa con el visor mediante una transición compartida, porque produce una ampliación más clara que una aparición aislada.
- **Sí:** mantener `src` y `alt` como único contrato del diálogo, porque los datos ya existen en `ImageUpload` y no se necesita persistencia ni metadatos adicionales.
- **Sí:** permitir abrir cualquier preview disponible, sin bloquearlo durante operaciones de imagen, porque el visor es de solo lectura.
- **Sí:** cerrar mediante botón, Escape y backdrop, porque cubre control explícito, teclado y uso habitual de un modal.
- **Sí:** usar `object-contain`, porque evita recortar imágenes con proporciones diferentes.
- **Sí:** incluir fallback CSS y soporte de `prefers-reduced-motion`, porque la View Transition API y el movimiento no están disponibles o no son apropiados en todos los entornos.
- **No:** usar `withViewTransitions` en el router, porque ampliaría el alcance a todas las navegaciones.
- **No:** crear un modelo de imagen ampliada o persistir el estado del visor, porque la funcionalidad solo presenta datos existentes de forma temporal.
- **No:** añadir galería, zoom, descarga o edición, porque cada capacidad requiere decisiones y UX propias.

## Risks

| Risk                                                           | Mitigation                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| El navegador no soporta la View Transition API.                | Detectar la API y usar una transición CSS equivalente sin impedir la apertura ni el cierre.         |
| El nombre de transición se duplica entre varias miniaturas.    | Activar el nombre compartido únicamente en la miniatura seleccionada y usar el identificador local. |
| La imagen guardada o el blob local deja de estar disponible.   | Mostrar un mensaje de error dentro del diálogo y mantener el cierre disponible.                     |
| El foco se pierde al cerrar un overlay creado por CDK Dialog.  | Conservar la referencia al botón activador y devolverle el foco en el cierre.                       |
| La animación afecta a usuarios con sensibilidad al movimiento. | Desactivar el movimiento no esencial bajo `prefers-reduced-motion: reduce`.                         |

## What is **not** in this spec

- Cambios al modelo, API o persistencia de imágenes.
- Descarga, reemplazo, edición, recorte o rotación.
- Galería, navegación entre imágenes, zoom o gestos táctiles.
- Cambios al flujo de subida, reintento, eliminación o imagen principal.
- Transiciones globales del router.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
