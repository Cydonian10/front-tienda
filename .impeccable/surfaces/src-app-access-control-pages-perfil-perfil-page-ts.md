---
version: 1
slug: "src-app-access-control-pages-perfil-perfil-page-ts"
primary_target: "src/app/access-control/pages/perfil/perfil.page.ts"
related_targets: ["src/app/layouts/components/admin-header.ts"]
---

# Perfil de usuario

Mode: Operate. Target: `/admin/perfil`, a read-only view of the signed-in employee's real `AuthPerfil`. Access through the existing header. Preserve the administrative shell, routes, Montserrat, semantic theme tokens and existing authentication flow. No editing endpoints, sample claims, or decorative raster assets.

## Direction contract

THESIS: Make identity and assigned access understandable at a glance, following the supplied `pantallas/perfil-imagen-referencia.png`, not replacing the panel's visual identity.

OWN-WORLD: Inherit Taller de precisión: slate identity band, turquoise initials, flat theme-aware surfaces, box radii and quiet dividers. Account states use success/warning/error independently of brand colour.

STORY: The employee recognises their account, checks personal and account information, then reads roles and permissions grouped by resource. Counts reflect the actual profile, and empty data never implies access.

FIRST VIEWPORT: Existing rail and header, one page title, a generous identity band, three compact summary cells. Below, account and personal data on the left, roles and grouped permission chips on the right. Mobile stacks these in a deliberate reading order; long names and codes wrap.

FORM: User-pinned reference, no concept roll (seed key: user-pinned-perfil-reference). Preserve its information architecture, but omit ornamental grids and duplicate headings. Header identity is the native profile link; there is no editing action.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
