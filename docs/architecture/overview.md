# Architecture Overview

La V0.1 usa un unico proyecto Next.js bajo `src/`. Es mas simple que un monorepo porque todavia no hay multiples apps ni paquetes compartidos reales.

Limites iniciales:

- `src/app`: UI y rutas de Next.js.
- `src/modules/catalog`: tipos de componentes.
- `src/modules/builds`: composicion de builds.
- `src/modules/compatibility`: reglas puras de compatibilidad.
- `src/modules/pricing`: dinero y calculo de totales.
- `src/db`: limite de persistencia; sin esquema amplio todavia.
- `src/shared`: utilidades compartidas de bajo nivel.

React no debe acceder directamente a persistencia. Las reglas de dominio deben ser funciones puras cuando sea posible.
