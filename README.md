# FrontTienda

## Producción con Docker

La imagen incluye el servidor SSR de Angular. Se construye una vez y su configuración
se proporciona al iniciar cada contenedor:

```bash
docker build -t front-tienda:produccion .
cp .env.example .env
# Edita .env con la URL de tu API y el dominio del frontend.
docker run -d --name front-tienda --restart unless-stopped --env-file .env -p 4000:4000 front-tienda:produccion
```

Abre `http://localhost:4000`. Las variables disponibles son:

| Variable | Descripción |
| --- | --- |
| `API_URL` | Obligatoria en producción. URL absoluta HTTP(S) de la API, incluyendo `/api` si corresponde, por ejemplo `https://api.ejemplo.com/api`. |
| `PORT` | Puerto interno del servidor; por defecto `4000`. Si lo cambias, ajusta también el segundo puerto de `-p`. |
| `NG_ALLOWED_HOSTS` | Dominios públicos permitidos por Angular SSR, separados por comas, sin protocolo ni puerto; por ejemplo `tienda.ejemplo.com,www.ejemplo.com`. |

`API_URL` debe ser accesible tanto desde el contenedor como desde el navegador de los
usuarios: no uses `localhost` ni un nombre interno de Docker para un despliegue remoto.
La URL se publica en `/runtime-config.js`, por lo que **no debe contener secretos**.
Los cambios en variables requieren recrear el contenedor, pero no reconstruir la imagen.
El endpoint `/health` comprueba que el servidor responde; no comprueba la API.

En producción coloca un proxy inverso con HTTPS delante del contenedor y configura
en la API el CORS para el origen del frontend. Configura `NG_ALLOWED_HOSTS` con los
dominios reales; de otro modo Angular puede rechazar peticiones SSR con HTTP 400.
El proxy debe reenviar un encabezado `Host` permitido y no exponer el contenedor
directamente si se depende de reglas de seguridad del proxy.

Para desarrollo, `npm run start` sigue utilizando `http://localhost:3000/api`.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
