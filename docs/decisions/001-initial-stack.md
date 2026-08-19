# 001 - Initial Stack

Decision: iniciar con un unico proyecto Next.js en `src/`, TypeScript estricto, Tailwind CSS, Zod, Drizzle ORM, PostgreSQL y Vitest.

Motivos:

- La carpeta estaba vacia, asi que no habia estructura previa que preservar.
- Un monorepo seria prematuro para la V0.1.
- `src/modules/*` permite separar dominio de UI sin agregar complejidad.
- Drizzle y PostgreSQL quedan instalados para el limite de persistencia, pero no se modela un esquema futuro todavia.
- Vitest cubre reglas de dominio sin depender de React ni de una base de datos.
