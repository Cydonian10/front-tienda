# Repository notes

- Single Angular 22 app (npm, `package-lock.json`). `npm run start` serves the development configuration; `npm run build` defaults to production and emits the server build under `dist/front-tienda/`. `npm run serve:ssr:front-tienda` starts Express on `PORT` or 4000.
- Run tests once with `npm test -- --watch=false`; run one spec with `npm test -- --watch=false --include=app/auth/services/auth-session.service.spec.ts` (`--include` is relative to `src/`). Tests use Angular's unit-test builder with Vitest + jsdom; there is no configured e2e or lint target.
- Browser entry: `src/main.ts`; providers, HTTP interceptor and query client: `src/app/app.config.ts`. `src/app/app.routes.ts` lazy-loads `src/app/auth/auth.routes.ts` and `src/app/access-control/access-control.routes.ts` (the `/admin` feature). `src/app/app.routes.server.ts` client-renders `auth/**` and `admin/**` and prerenders other paths; Express entry: `src/server.ts`.
- API code lives in `src/app/api/`; session, guards and interceptor in `src/app/auth/`; UI state in `src/app/store/`. `src/app/api/config/env-dev.ts` imports `environment.development.ts` directly, bypassing Angular's environment replacement: API calls target `http://localhost:3000/api` even in production builds (where `environment.ts` says `/api`). `src/server.ts` has no API proxy.
- Tailwind 4 and daisyUI 5 themes live in `src/styles.css` (`ferreteria` default, `light` alternative); use `DESIGN.md` for the intended visual tokens when changing UI.

## Convenciones de código

- Organizar por funcionalidad: `src/app/<feature>/pages/<pagina>/` para la página, su HTML, pruebas y `components/` locales; `<feature>/actions/` para consultas y mutaciones; `src/app/api/` para HTTP y contratos; `src/app/shared/` solo para código reutilizado entre funcionalidades.
- Mantener páginas y componentes legibles: extraer componentes pequeños cuando una sección tenga UI o lógica propia y una responsabilidad clara; no dividir solo por tamaño. Dejar la orquestación en la página y la lógica de acceso a datos fuera de la vista.
- Usar señales de Angular para estado local y derivaciones (`computed`); usar TanStack Query para estado remoto. No duplicar respuestas de consultas en señales locales salvo necesidad concreta.
- En TanStack Query, incluir todos los parámetros de la petición en una `queryKey` estable, mantener la llamada HTTP en `queryFn`, y usar `injectMutation` para escrituras. Tras mutar, invalidar solo las claves afectadas; contemplar carga, error y estado vacío en la UI.
- Mantener permisos en comprobaciones reutilizables y reactivas (véase `src/app/auth/services/use-permissions.ts`); ocultar controles no sustituye las verificaciones al ejecutar acciones. Priorizar nombres claros, código sencillo y pruebas para el comportamiento relevante.
