---
name: 'Ferretería Atlas · Taller de precisión'
description: 'Sistema operativo sobrio para gestionar una ferretería con superficies de pizarra, acentos turquesa y señalización semántica clara.'
colors:
  pizarra-profunda: 'oklch(24% 0.025 250)'
  pizarra-panel: 'oklch(28% 0.025 250)'
  pizarra-borde: 'oklch(35% 0.028 250)'
  niebla-clara: 'oklch(92% 0.014 250)'
  turquesa-herramienta: 'oklch(68% 0.13 176)'
  tinta-turquesa: 'oklch(16% 0.02 176)'
  azul-calibre: 'oklch(69% 0.11 220)'
  tinta-azul: 'oklch(16% 0.02 220)'
  ambar-senal: 'oklch(78% 0.14 82)'
  tinta-ambar: 'oklch(20% 0.03 82)'
  pizarra-neutral: 'oklch(38% 0.025 250)'
  texto-neutral: 'oklch(90% 0.012 250)'
  informacion: 'oklch(68% 0.12 230)'
  informacion-texto: 'oklch(18% 0.03 230)'
  exito: 'oklch(68% 0.16 160)'
  exito-texto: 'oklch(16% 0.03 160)'
  advertencia: 'oklch(79% 0.16 82)'
  advertencia-texto: 'oklch(23% 0.05 82)'
  peligro: 'oklch(65% 0.18 25)'
  peligro-texto: 'oklch(96% 0.01 25)'
  lienzo-administrativo-claro: 'oklch(96% 0.012 250)'
  navegacion-pizarra: 'oklch(25.629% 0.02921 253.069)'
  navegacion-elevada: 'oklch(36% 0.04 250)'
  navegacion-borde: 'oklch(43% 0.03 250)'
  navegacion-pizarra-clara: 'oklch(37% 0.053 250)'
  navegacion-elevada-clara: 'oklch(42% 0.049 250)'
  navegacion-borde-claro: 'oklch(49% 0.04 250)'
  navegacion-texto: 'oklch(95% 0.01 250)'
  navegacion-seleccion: 'oklch(79% 0.11 179)'
  navegacion-seleccion-texto: 'oklch(25% 0.03 190)'
  acceso-ambar: 'oklch(67% 0.145 78)'
  acceso-ambar-fuerte: 'oklch(59% 0.14 75)'
  acceso-tinta: 'oklch(24% 0.03 244)'
  acceso-texto-secundario: 'oklch(49% 0.025 240)'
  acceso-lienzo-mineral: 'oklch(94% 0.006 80)'
  acceso-borde: 'oklch(76% 0.01 240)'
  acceso-tinta-sobre-ambar: 'oklch(18% 0.026 70)'
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  headline:
    fontSize: 'clamp(1.35rem, 2vw, 1.875rem)'
    fontWeight: 650
    lineHeight: 1.14
    letterSpacing: '-0.035em'
  title:
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: '-0.025em'
  metric:
    fontSize: 'clamp(1.5rem, 2.3vw, 2.05rem)'
    fontWeight: 620
    lineHeight: 1
    letterSpacing: '-0.045em'
  label:
    fontSize: '0.875rem'
    fontWeight: 600
  overline:
    fontSize: '0.67rem'
    fontWeight: 720
    letterSpacing: '0.1em'
  caption:
    fontSize: '0.75rem'
  acceso-hero:
    fontFamily: "'Barlow', ui-sans-serif, system-ui, sans-serif"
    fontSize: 'clamp(3rem, 4.5vw, 4.25rem)'
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: '-0.04em'
  acceso-heading:
    fontFamily: "'Barlow', ui-sans-serif, system-ui, sans-serif"
    fontSize: 'clamp(2rem, 2.3vw, 2.55rem)'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.038em'
rounded:
  selector: '0.375rem'
  field: '0.5rem'
  box: '0.875rem'
  acceso-control: '0.65rem'
  circular: '999px'
spacing:
  unit: '0.25rem'
  compact: '0.75rem'
  standard: '1rem'
  section: '1.5rem'
  spacious: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.turquesa-herramienta}'
    textColor: '{colors.tinta-turquesa}'
    typography: '{typography.label}'
    rounded: '{rounded.field}'
    height: '2.75rem'
  input-default:
    backgroundColor: '{colors.pizarra-profunda}'
    textColor: '{colors.niebla-clara}'
    typography: '{typography.body}'
    rounded: '{rounded.field}'
    height: '2.75rem'
  container-default:
    backgroundColor: '{colors.pizarra-panel}'
    textColor: '{colors.niebla-clara}'
    rounded: '{rounded.box}'
    padding: '{spacing.section}'
  dashboard-card:
    backgroundColor: '{colors.pizarra-panel}'
    textColor: '{colors.niebla-clara}'
    rounded: '{rounded.box}'
    padding: '{spacing.standard}'
  admin-navigation-current:
    backgroundColor: '{colors.navegacion-seleccion}'
    textColor: '{colors.navegacion-seleccion-texto}'
    typography: '{typography.label}'
    rounded: '{rounded.field}'
    height: '3rem'
  overlay-panel:
    backgroundColor: '{colors.pizarra-panel}'
    textColor: '{colors.niebla-clara}'
    rounded: '{rounded.box}'
    padding: '{spacing.unit}'
  acceso-button-primary:
    backgroundColor: '{colors.acceso-ambar-fuerte}'
    textColor: '{colors.acceso-tinta-sobre-ambar}'
    typography: '{typography.label}'
    rounded: '{rounded.acceso-control}'
    height: '3.5rem'
  acceso-input:
    backgroundColor: '{colors.acceso-lienzo-mineral}'
    textColor: '{colors.acceso-tinta}'
    typography: '{typography.body}'
    rounded: '{rounded.acceso-control}'
    height: '3.55rem'
---

# Sistema de diseño: Ferretería Atlas

## Overview

**Creative North Star: "Taller de precisión"**

El sistema de Ferretería Atlas traduce la disciplina de un taller bien ordenado a una interfaz sobria y operativa: cada superficie tiene una función, cada acento señala una decisión y la densidad se mantiene contenida. La base fría de pizarra aporta estabilidad; el turquesa identifica orientación y acción sin convertir el panel en una experiencia ornamental.

Los componentes se sienten robustos y contenidos. La jerarquía depende de contraste, ritmo, tipografía y estados explícitos antes que de efectos. El panel administrativo activo y los patrones implementados del dashboard comparten este vocabulario, aunque algunas composiciones del dashboard todavía no estén conectadas a una ruta.

El acceso extiende este sistema con un sublenguaje local, no con una identidad sustituta: contrapone una fotografía oscura del taller y un lienzo mineral claro, y traslada el ámbar de señal a marca, foco y acción. Esta puerta de entrada no modifica la pizarra ni el turquesa del panel administrativo.

**Key Characteristics:**

- Superficies frías y compactas organizadas por capas tonales.
- Turquesa herramienta reservado para acciones, foco, selección y datos destacados.
- Tipografía del sistema, números tabulares y microetiquetas técnicas para lectura rápida.
- Estados semánticos visibles y controles con áreas táctiles de al menos (2.75rem).
- Acceso editorial dividido, con fotografía de oficio, superficie mineral y ámbar confinado a su ámbito.

## Colors

La paleta combina una base de pizarra azulada con acentos funcionales de taller y colores semánticos independientes.

### Primary

- **Turquesa herramienta:** acción principal, foco, selección, barras de datos y orientación activa.
- **Tinta turquesa:** contenido de alto contraste sobre el primario.

### Secondary

- **Azul calibre:** controles auxiliares y énfasis secundario, especialmente cuando una acción debe distinguirse del primario.
- **Tinta azul:** contenido sobre superficies secundarias.

### Tertiary

- **Ámbar señal:** acento puntual y advertencias visuales no destructivas.
- **Tinta ámbar:** contenido sobre el acento cálido.
- **Ámbar de acceso / Ámbar de acceso fuerte:** variantes locales del mismo carácter de señal para la marca, el foco y la acción principal del login; no sustituyen el turquesa administrativo.

### Neutral

- **Pizarra profunda:** superficie global del tema `ferreteria`.
- **Pizarra panel:** lienzos, tarjetas y overlays del tema oscuro.
- **Pizarra borde:** divisores y límites de baja prominencia.
- **Niebla clara:** texto principal del tema oscuro.
- **Pizarra neutral / Texto neutral:** superficies neutrales como avatares y su contenido.
- **Lienzo administrativo claro:** fondo frío del área de trabajo cuando el tema global es `light`.
- **Navegación pizarra:** superficie local oscura y constante de la barra lateral; tiene variantes algo más luminosas en el tema claro.
- **Navegación selección:** turquesa local más luminoso para la ruta actual, con texto oscuro propio.
- **Lienzo mineral de acceso:** superficie clara y cálida del formulario de autenticación.
- **Tinta, texto secundario y borde de acceso:** escala azul-pizarra local que mantiene jerarquía y contraste sobre el lienzo mineral.

Los roles **información**, **éxito**, **advertencia** y **peligro**, junto con sus tintas de contraste, son semánticos. No deben sustituirse por el primario; se usan en actividad, validación, toasts, confirmaciones y metas.

**The One Tool Color Rule.** El turquesa herramienta guía acciones y orientación; no se usa como relleno decorativo de grandes superficies.

**The Semantic Independence Rule.** Éxito, advertencia y peligro conservan su significado incluso cuando el tema o la navegación cambian.

**The Scoped Doorway Rule.** El ámbar conduce el acceso; el turquesa sigue perteneciendo al panel administrativo. Ninguno invade el ámbito del otro.

## Typography

**Display Font:** sans del sistema con `system-ui` y fallbacks nativos en el panel; Barlow autoalojada en pesos 600 y 700 solo para la marca y los titulares del acceso.
**Body Font:** la misma familia sans para una interfaz rápida, consistente y sin dependencia de fuentes externas.

**Character:** neutral, compacta y precisa. El panel mantiene su voz sistémica; Barlow aporta al acceso una señal industrial más explícita sin extenderse a cuerpo, etiquetas ni controles.

### Hierarchy

- **Title** (600, `1.5rem` a `1.875rem`, 1.25): títulos de sección del panel, con tracking ligeramente cerrado.
- **Metric** (620, escala fluida, 1): cifras KPI y totales; usa cifras tabulares y tracking cerrado.
- **Body** (400, `0.875rem`, 1.5): instrucciones, descripciones y contenido de formularios.
- **Label** (600, `0.875rem`): navegación, botones y controles; la selección puede subir de peso para reforzar estado.
- **Overline** (720, `0.67rem`, `0.1em`, mayúsculas): agrupaciones de navegación y contexto corto.
- **Caption** (`0.75rem`): metadatos, sesión, estado y notas auxiliares.
- **Access Hero** (600, escala fluida, 1.16): promesa de marca sobre la fotografía del taller.
- **Access Heading** (700, escala fluida, 1.1): bienvenida y titulares principales del formulario de acceso.

**The Numeric Discipline Rule.** Métricas, importes y celdas numéricas usan cifras tabulares; los números importantes no dependen solo del color.

**The Auth Type Boundary Rule.** Barlow 600/700 se reserva para marca y titulares de acceso; el contenido funcional conserva la sans del sistema.

## Layout

El panel activo usa una barra lateral de (16.5rem), limitada al (85vw), y pasa de drawer superpuesto a columna fija en `lg` (1024px). La cabecera permanece fija durante el desplazamiento con altura mínima de (4.75rem). El área principal tiene un ancho máximo de (80rem), relleno horizontal progresivo de (1rem), (1.5rem) y (2rem), y relleno vertical de (1.5rem) que crece a (2rem).

El dashboard implementado usa un lienzo de hasta (1600px), grids de tres KPI y dos columnas asimétricas. Bajo (1024px), los paneles principales se apilan; bajo (720px), los KPI pasan a una columna, el resumen de ventas se apila y el gráfico reduce etiquetas. Bajo (420px), la cabecera simplifica controles secundarios.

El ritmo base es de (0.25rem), pero la composición trabaja principalmente en saltos de (0.75rem), (1rem), (1.5rem) y (2rem). Las tablas y listas son compactas; formularios, diálogos y zonas de carga preservan áreas de interacción cómodas.

El acceso usa en escritorio una división aproximada (47/53): fotografía a la izquierda y formulario centrado en una columna de hasta (27rem) a la derecha. A partir de (720px) hacia abajo, la fotografía se convierte en una cabecera compacta de (18rem) y el formulario se apila sobre el lienzo mineral; bajo (390px), la cabecera baja a (15.5rem) y el relleno lateral se ajusta sin alterar el orden de lectura.

## Elevation & Depth

La profundidad se construye con capas tonales y bordes de (1px). Tarjetas, cabecera, pie y navegación permanecen planas en reposo; el tema `ferreteria` desactiva profundidad y ruido. Las sombras se reservan para elementos que realmente abandonan el flujo: overlays de selección y notificaciones. El toast usa una sombra ambiental amplia; no establece un precedente para sombrear todas las tarjetas.

En el acceso, la profundidad procede de la fotografía oscurecida mediante velos tonales y del corte limpio contra el lienzo mineral. El formulario no flota en una tarjeta y sus controles permanecen planos, delimitados por borde.

**The Tonal Layers Rule.** Una superficie en flujo se separa primero por tono y borde; la sombra solo comunica flotación real.

## Shapes

Los campos y enlaces operativos usan esquinas moderadamente curvas; los contenedores y overlays tienen un radio mayor y tranquilo. Badges, avatares, indicadores y puntos de leyenda pueden ser circulares. Las zonas de carga usan borde discontinuo para expresar entrada de archivos, mientras que tablas y listas se apoyan en divisores rectos.

El lenguaje evita tanto los rectángulos totalmente duros como las cápsulas indiscriminadas: la forma circular se reserva para identidades, estados y datos puntuales.

El acceso conserva radios moderados en sus controles (0.65rem): suficientemente suaves para el lienzo claro, pero sin convertir campos o botones en cápsulas.

## Components

Los componentes son robustos y contenidos: acciones inequívocas, estados visibles y decoración mínima.

### Buttons

- **Shape:** radio de campo y altura mínima de (2.75rem) en acciones táctiles.
- **Primary:** turquesa herramienta con tinta oscura; se reserva para la acción principal del contexto.
- **Hover / Focus:** el hover cambia tono sin desplazar el control; el foco visible usa contorno primario de (2px) separado (3px).
- **Ghost / Neutral:** acciones secundarias conservan el fondo de su superficie y ganan contraste en hover.
- **Danger:** usa el rol peligro únicamente para acciones destructivas confirmadas.

### Cards / Containers

- **Corner Style:** radio de caja.
- **Background:** una capa tonal por encima o por debajo del lienzo; nunca una tarjeta blanca arbitraria dentro del tema oscuro.
- **Shadow Strategy:** sin sombra en reposo.
- **Border:** borde tenue derivado del contenido o de la superficie de borde.
- **Internal Padding:** normalmente (1rem), con separación interna basada en el mismo ritmo.

### Inputs / Fields

- **Style:** controles daisyUI ligados al tema, radio de campo, texto heredado y placeholder atenuado.
- **Focus:** contorno primario visible; no se comunica solo mediante cambio de color.
- **Error / Disabled:** error semántico explícito; el estado deshabilitado reduce opacidad y bloquea interacción.
- **Search Select:** disparador de ancho completo; overlay tonal con búsqueda, lista desplazable, navegación por teclado y selección marcada.

### Authentication

- **Composition:** pantalla dividida sin tarjeta flotante; fotografía de taller oscura frente a lienzo mineral claro.
- **Fields:** altura de (3.55rem), borde fino, fondo integrado al lienzo, radio moderado y foco ámbar visible.
- **Buttons:** altura de (3.5rem), radio compartido con los campos; la acción principal usa ámbar fuerte y la alternativa conserva fondo transparente y borde.
- **Brand:** Barlow 600/700 autoalojada en `public/fonts/barlow-600.ttf` y `public/fonts/barlow-700.ttf`, marca geométrica y fotografía `public/images/imagen-login-ferreteria.png`; el cuerpo y los controles mantienen la sans del sistema.
- **Responsive:** cabecera fotográfica compacta y formulario apilado en móvil; la promesa de marca se conserva y el contenido auxiliar de la fotografía se retira.
- **Capability state:** recuperación, acceso principal y Google pueden presentarse como opciones visuales deshabilitadas, sin sugerir que ya están conectadas.

### Navigation

- La barra lateral mantiene pizarra azulada en ambos temas y remapea localmente sus tokens sin alterar el tema global.
- Los grupos nativos `details/summary` parten cerrados. Abrir un grupo no selecciona una ruta.
- La ruta actual usa el turquesa local, texto oscuro, peso reforzado y flecha visible. En móvil, overlay, Escape y navegación cierran el drawer y restauran el foco al disparador.

### File Upload

- Contenedor de radio de caja con borde discontinuo de (2px), icono primario y acción clara.
- Durante drag, el borde pasa al primario y aparece una capa primaria tenue. Errores, reglas, lista de archivos y acción de quitar permanecen visibles y accesibles.

### Feedback

- Los diálogos usan superficie global, borde, radio de caja y acciones apiladas en móvil; el foco inicial cae en cancelar y se restaura al cerrar.
- Los toasts flotan en la esquina superior derecha, admiten tonos semánticos y entrada vertical breve; no mueven el foco y respetan reducción de movimiento.
- Los tooltips complementan controles por hover de puntero y foco, se descartan con Escape o click y no aparecen por hover táctil.

## Do's and Don'ts

### Do:

- **Do** mantener los colores administrativos dentro de su ámbito y los colores de página ligados al tema global.
- **Do** usar capas tonales, divisores tenues y jerarquía tipográfica antes de añadir sombras.
- **Do** conservar foco visible, áreas táctiles mínimas, estados semánticos y restauración de foco en overlays.
- **Do** usar cifras tabulares en métricas, importes y tablas.
- **Do** tratar el acceso como una extensión local: fotografía oscura, lienzo mineral y ámbar de señal, sin alterar el panel administrativo.
- **Do** reservar Barlow 600/700 para la marca y los titulares del acceso.

### Don't:

- **Don't** modificar el tema incorporado `light` para imitar la barra lateral; la navegación ya tiene tokens locales.
- **Don't** convertir el turquesa herramienta en sustituto de éxito, advertencia o peligro.
- **Don't** aplicar sombras a tarjetas estáticas ni usar cápsulas para cualquier contenedor.
- **Don't** introducir otra fuente o un color decorativo fuera de los compromisos explícitos de identidad de Ferretería Atlas.
- **Don't** llevar el ámbar del acceso al panel administrativo ni reemplazar allí el turquesa herramienta.
- **Don't** convertir el login en una tarjeta flotante sobre la fotografía ni presentar recuperación, Google o autenticación como servicios conectados.
