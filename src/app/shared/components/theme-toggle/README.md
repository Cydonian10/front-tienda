# Tema claro / oscuro

El proyecto habilita el tema `light` original de daisyUI y conserva `ferreteria` como oscuro predeterminado. No se añade una paleta clara personalizada.

`ThemeToggle` está en la cabecera administrativa. Alterna el atributo `data-theme` del documento para que layouts, select, overlays y toasts compartan el mismo tema. La preferencia se guarda en `localStorage` con la clave `front-tienda-theme`; si el navegador bloquea el almacenamiento, el cambio funciona durante la sesión.

Para reutilizar el botón, importa `ThemeToggle` en el componente consumidor y añade `<app-theme-toggle />` a su plantilla. No fijes otro `data-theme` en un contenedor salvo que quieras excluirlo del tema global.

También puedes inyectar `ThemeService` y llamar a `toggle()` o `setTheme('light')` / `setTheme('ferreteria')`. `theme()` e `isLight()` exponen el estado de solo lectura. La preferencia se restaura después del primer render del navegador para conservar un estado inicial consistente con SSR/hidratación.
