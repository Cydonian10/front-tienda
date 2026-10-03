# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El acceso está dirigido principalmente al personal de Ferretería Atlas, incluidos administradores, cajeros y empleados que operan el negocio.

## Product Purpose

La aplicación permite al equipo de Ferretería Atlas acceder a un panel administrativo para gestionar las operaciones de la ferretería. El inicio de sesión funciona como puerta de entrada segura y reconocible al entorno de trabajo.

## Operating Context

El producto se utiliza como herramienta interna de trabajo. Tras iniciar sesión, el usuario continúa al panel administrativo.

## Capabilities and Constraints

- La aplicación web está construida con Angular, Tailwind CSS y daisyUI.
- La ruta de acceso es `/auth/login` y el área de trabajo se encuentra bajo `/admin`.
- La entrega actual del inicio de sesión es exclusivamente visual; la autenticación, la recuperación de contraseña y el acceso con Google aún no están conectados a servicios reales.
- La interfaz debe adaptarse a escritorio y móvil, mantener controles semánticos y conservar estados de foco visibles.

## Brand Commitments

- Nombre confirmado: **Ferretería Atlas**.
- El acceso debe conservar la referencia visual aportada por el usuario: una composición de taller sobria, con fotografía de herramientas y acentos ámbar.

## Evidence on Hand

- Imagen principal facilitada por el usuario: `imagen-logn-ferreteria.png`.
- Referencia visual de la pantalla de acceso proporcionada en la conversación.
- No hay evidencia de un proveedor de autenticación, endpoints, textos de error ni credenciales de demostración; no deben inventarse como funcionalidad real.

## Product Principles

- Priorizar una entrada clara y directa al trabajo diario.
- Comunicar orden, solidez y oficio sin añadir distracciones.
- Mantener accesibles y reconocibles los controles esenciales.
- No presentar integraciones o capacidades de autenticación como activas antes de conectarlas.
