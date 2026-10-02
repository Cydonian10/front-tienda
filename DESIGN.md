---
name: "front-tienda · Panel administrativo"
description: "Paleta administrativa implementada: azul pizarra, selección turquesa y superficies frías."
colors:
  ferreteria-base-100: "oklch(24% 0.025 250)"
  ferreteria-base-200: "oklch(28% 0.025 250)"
  ferreteria-base-300: "oklch(35% 0.028 250)"
  ferreteria-base-content: "oklch(92% 0.014 250)"
  ferreteria-neutral: "oklch(38% 0.025 250)"
  ferreteria-neutral-content: "oklch(90% 0.012 250)"
  ferreteria-primary: "oklch(68% 0.13 176)"
  ferreteria-primary-content: "oklch(16% 0.02 176)"
  admin-canvas-light: "oklch(96% 0.012 250)"
  admin-nav-surface: "oklch(32% 0.042 250)"
  admin-nav-raised: "oklch(36% 0.04 250)"
  admin-nav-border: "oklch(43% 0.03 250)"
  admin-nav-surface-light: "oklch(37% 0.053 250)"
  admin-nav-raised-light: "oklch(42% 0.049 250)"
  admin-nav-border-light: "oklch(49% 0.04 250)"
  admin-nav-content: "oklch(95% 0.01 250)"
  admin-nav-accent: "oklch(79% 0.11 179)"
  admin-nav-accent-content: "oklch(25% 0.03 190)"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
  title:
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  label:
    fontSize: "0.875rem"
    fontWeight: 500
  caption:
    fontSize: "0.75rem"
rounded:
  ferreteria-selector: "0.375rem"
  ferreteria-field: "0.5rem"
  ferreteria-box: "0.875rem"
spacing:
  unit: "0.25rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
components:
  admin-navigation-current:
    backgroundColor: "{colors.admin-nav-accent}"
    textColor: "{colors.admin-nav-accent-content}"
    typography: "{typography.label}"
  admin-workspace-light:
    backgroundColor: "{colors.admin-canvas-light}"
  admin-workspace-ferreteria:
    backgroundColor: "{colors.ferreteria-base-200}"
---

# Sistema de diseño: panel administrativo

## Overview
Registro acotado de la paleta aprobada y construida; no define una nueva identidad comercial ni un sistema completo para todas las páginas.

**Características clave:**
- Barra lateral azul pizarra en ambos temas.
- Ruta seleccionada turquesa con texto oscuro.
- Lienzo gris frío claro y superficies oscuras de pizarra más claras.

Autoridad: `src/styles.css`, `src/app/layouts/admin.layout.ts` y sus componentes `admin-header.ts` y `admin-footer.ts`; capturas revisadas de `/admin/roles` en `light` y `ferreteria`.

## Colors
**Primary:** `ferreteria-primary` es el primario global del tema oscuro; `admin-nav-accent` es el turquesa local de navegación, no su sustituto global. Los colores de estado siguen siendo semánticos e independientes.

**Neutral:** `ferreteria-base-*` y `ferreteria-neutral*` pertenecen al tema global personalizado `ferreteria`, predeterminado y con esquema oscuro. `light` sigue siendo el tema incorporado de daisyUI, sin modificaciones.

En `.admin-shell`, `--admin-canvas` toma `var(--color-base-200)`; únicamente `:root[data-theme='light'] .admin-shell` lo sustituye por `admin-canvas-light`. Ese selector también cambia los tres tokens `--admin-nav-surface`, `--admin-nav-raised` y `--admin-nav-border` por sus variantes claras. Contenido, acento y contenido del acento permanecen iguales en ambos temas.

Solo `.admin-sidebar` declara `color-scheme: dark` y remapea `--color-base-100/200/300` a `--admin-nav-surface/raised/border`, `--color-base-content` a `--admin-nav-content` y `--color-primary/primary-content` a `--admin-nav-accent/accent-content`. Cabecera, pie y componentes de página conservan los colores del tema global.

## Typography
Se hereda la pila sans del sistema de Tailwind instalado; no hay una tipografía de marca añadida. El título de sección usa `title` y aumenta a (1.875rem) desde `sm`; navegación y descripción usan (0.875rem), metadatos y pie (0.75rem). La selección aumenta el peso del enlace de (500) a (600).

## Layout
La barra lateral mide (16.5rem), limitada a (85vw); desde `lg` (1024px) permanece abierta. Por debajo funciona como drawer superpuesto. Cabecera fija al desplazamiento, de altura mínima (4.75rem); pie con mínimo (3.5rem).

El espacio principal tiene ancho máximo (80rem), márgenes automáticos y relleno horizontal de (1rem), (1.5rem) desde `sm` (640px) y (2rem) desde `lg`; relleno vertical de (1.5rem), luego (2rem) en `lg`. Esta composición y las rutas `/admin/roles` y `/admin/usuarios` son estrategia de esta superficie, no tokens globales ni reglas para otras páginas.

## Elevation & Depth
El marco administrativo se separa por superficies y bordes de (1px), no por sombras añadidas. `ferreteria` conserva `--depth: 0` y `--noise: 0`; esto no altera la elevación propia del tema incorporado `light`.

## Shapes
Enlaces, grupos y marca usan el radio semántico de campo (`rounded-field`); el avatar es circular. Los radios del frontmatter describen únicamente `ferreteria`: los de `light` siguen perteneciendo a daisyUI.

## Components
- **Navegación:** grupos nativos `details/summary`, inicialmente cerrados; el grupo cerrado usa superficie elevada, abierto usa fondo transparente. Abrir el grupo no selecciona una ruta.
- **Enlaces:** texto normal mezclado al (88%) con transparente; hover con superficie elevada y texto completo. `RouterLinkActive` añade `menu-active` y `aria-current="page"`: fondo turquesa, texto oscuro, peso (600) y flecha visible. Altura mínima (3rem), relleno horizontal (0.75rem). Foco en enlaces y grupos: contorno primario de (2px), separado (3px).
- **Drawer:** conserva disparador con `aria-expanded` y control por Enter/Espacio; overlay, botón de cierre, Escape y navegación cierran el panel. Al cerrar un drawer abierto se devuelve el foco al disparador. Se conserva el enlace para saltar al contenido.
- **Cabecera y pie:** superficies globales `base-100`, bordes `base-300`; cabecera con selector de tema, sesión, avatar y acción de salida, pie con indicador de estado `success`.

## Do's and Don'ts
- **Do:** Mantener los colores administrativos dentro de sus ámbitos y los colores de página ligados al tema global.
- **Do:** Conservar grupos colapsables, ruta actual y controles accesibles del drawer.
- **Don't:** Modificar el tema incorporado `light` para reproducir el azul pizarra de la barra lateral.
- **Don't:** Convertir el turquesa local de selección en un reemplazo global de colores primarios o de estado.
