# Repository notes

- Single Angular 22 app (npm, `package-lock.json`); `npm run start` serves the development build, but `npm run build` produces the production SSR build (`dist/front-tienda/`). `npm run serve:ssr:front-tienda` starts its Express server on `PORT` or 4000.
- Run tests with `npm test -- --watch=false`; target one spec with `npm test -- --watch=false --include=app/auth/services/auth-session.service.spec.ts` (`--include` is relative to `src/`). The Angular unit-test builder uses Vitest + jsdom; no e2e or lint script is configured.
- Browser entry: `src/main.ts`; providers/interceptor: `src/app/app.config.ts`; lazy routes: `src/app/app.routes.ts` and feature `*.routes.ts`. The SSR entry is `src/server.ts`, but `auth/**` and `admin/**` are client-rendered in `src/app/app.routes.server.ts`.
- API code is under `src/app/api/`; auth session, guards and interceptor under `src/app/auth/`; UI state in `src/app/store/`. `src/app/api/config/env-dev.ts` imports `environment.development.ts` directly, so API calls currently target `http://localhost:3000/api` even when the production environment file says `/api`. `src/server.ts` does not implement an API proxy.
- Tailwind 4 and daisyUI 5 themes are configured in `src/styles.css` (`ferreteria` default, `light` alternative); consult `DESIGN.md` for the intended visual tokens when changing UI.
