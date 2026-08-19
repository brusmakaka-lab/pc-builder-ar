# PC Builder AR

Base inicial para una plataforma de armado de PCs enfocada primero en Argentina.

## Stack

- Next.js App Router.
- TypeScript estricto.
- Tailwind CSS.
- PostgreSQL y Drizzle ORM como limite de persistencia.
- Zod para validacion en boundaries.
- Vitest para tests unitarios.

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Estructura

```text
src/
  app/
  db/
  modules/
    builds/
    catalog/
    compatibility/
    pricing/
  shared/
```

La UI vive en `src/app`. La logica de negocio vive en `src/modules`. La persistencia debe entrar por `src/db`; React no debe acceder directamente a la base de datos.

## Entorno

Copiar `.env.example` a `.env.local` cuando se necesite una base local. No commitear credenciales reales.
