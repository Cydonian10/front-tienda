---
version: 1
slug: 'src-app-auth-pages-login-login-page-ts'
primary_target: 'src/app/auth/pages/login/login.page.ts'
related_targets: ['src/app/auth/layouts/auth.layout.ts']
---

# Login de Ferretería Atlas

## Scope

Ruta `/auth/login`; modo Operate.

## Audience and task

Personal de Ferretería Atlas que necesita reconocer el entorno correcto e iniciar el acceso al panel administrativo. La entrega actual es visual: no presenta recuperación, Google ni autenticación como servicios conectados.

## Constraints

Seguir la referencia aportada por el usuario y utilizar `imagen-logn-ferreteria.png`. Mantener HTML semántico, foco visible, contraste, adaptación móvil y los componentes daisyUI existentes. El panel administrativo y el resto de rutas quedan fuera de alcance.

## Direction contract

**THESIS:** Una puerta de acceso empresarial dividida entre el oficio tangible de la ferretería y un formulario nítido. Rechaza la tarjeta de login genérica flotando sobre una fotografía de fondo.

**OWN-WORLD:** Fotografía de taller oscura en un panel editorial de lado a lado, superficie de formulario gris mineral claro, tinta azul-pizarra y un único ámbar de señal para marca y acción. Controles robustos, bordes finos y esquinas moderadas.

**STORY:** El usuario reconoce primero Ferretería Atlas y su entorno de trabajo, lee una bienvenida breve y encuentra inmediatamente correo, contraseña y la acción principal. Recuperación y Google aparecen como opciones visuales secundarias, sin prometer conexión activa.

**FIRST VIEWPORT:** En escritorio, la fotografía ocupa aproximadamente el 47% izquierdo y el formulario el resto; marca arriba, promesa a media altura y pie al fondo sobre la imagen. El formulario queda centrado en una columna de unos 430px, con contexto arriba y copyright abajo. En móvil, la imagen se convierte en una cabecera compacta con marca y promesa; el formulario ocupa el cuerpo sin perder el primer campo ni la acción principal.

**FORM:** Referencia visual aportada por el usuario, elegida y fijada directamente; forma de pantalla dividida. Seed key: `pinned-reference-login-atlas`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
