# Roles y accesos

## Para administrar el equipo

1. Abre **Control de acceso → Roles y accesos**.
2. Elige el sistema en el que trabajará la persona.
3. Crea un rol, por ejemplo «Encargado de almacén».
4. En **Configurar accesos**, marca los grupos que necesita y guarda.
5. En **Usuarios**, asigna ese rol a las personas correspondientes.

No hace falta programar cada rol nuevo. Un usuario puede recibir varios roles; sus permisos se suman dentro del sistema correspondiente.

**Guía de accesos** explica los grupos disponibles. No crea permisos ni los asigna directamente a personas. **Configuración avanzada** permite ajustar acciones individuales sin descartar las selecciones existentes.

## Reglas explícitas

- La API sigue autorizando cada acción. Ocultar un enlace o botón no es una comprobación de seguridad.
- Los grupos solo seleccionan permisos existentes; se definen en `src/app/access-control/models/access-groups.ts` usando códigos, nunca UUID de la base.
- Cada grupo incluye sus consultas necesarias. Si falta un permiso del catálogo del servidor, el grupo aparece incompleto y no se puede asignar parcialmente como si estuviera completo.
- Marcar un grupo agrega sus permisos; desmarcarlo retira los que contiene. Los grupos que compartan esos permisos reflejan inmediatamente el nuevo estado.
- Una selección parcial aparece como **Personalizada/Parcial** y se conserva hasta que el administrador la cambie.
- Incorporar un permiso nuevo al código no modifica roles existentes: se necesita una asignación explícita.
- `SUPER_ADMIN` es el único código de rol reservado. Tiene acceso completo sin permisos individuales y no se edita desde la selección de grupos. Los nombres de los demás roles no tienen significado especial.
- Administrar usuarios o roles da control sobre el acceso del equipo. Concede esos grupos únicamente a personas de confianza.

## Reiniciar datos de desarrollo

El backend incluye `scripts/reset-development-data.mjs`. Por defecto muestra una vista previa y **no borra nada**:

```sh
NODE_ENV=development npm run data:reset-dev
```

En `api-tienda`, después de respaldar la base y los archivos y detener la API:

```sh
NODE_ENV=development npm run data:reset-dev -- --apply
npm run migration:permissions
```

Solo admite una base en `localhost`, `127.0.0.1` o `::1`, y un entorno explícito `development` o `test`. Requiere exactamente una cuenta activa con `SUPER_ADMIN` y asignación vigente. Conserva su usuario, persona, contraseña, rol y asignación; conserva también sistemas, catálogo técnico de permisos y migraciones. Borra el resto de los usuarios, roles y datos de inventario de una lista explícita, sin `CASCADE`. Retira únicamente archivos de imagen/comprobante con nombres administrados por la aplicación dentro del proyecto, sin seguir enlaces simbólicos.

No se ejecuta al iniciar la aplicación ni sustituye las migraciones. Una base con tablas adicionales se debe revisar antes de ampliar la lista de limpieza. No sirve para producción.

## Verificación

Frontend: `npm run build` y `npm test -- --watch=false`. Si Node expone su `localStorage` experimental e interfiere con jsdom, ejecuta `NODE_OPTIONS=--no-experimental-webstorage npm test -- --watch=false`.

Backend: `npm run build` y `npm test`. Las pruebas del reinicio usan dobles de la base de datos; no borran datos reales.
