# AGENTS.md

Reglas para trabajar en este proyecto:

- Leer `README.md` y la documentacion relevante en `docs/` antes de modificar codigo.
- Respetar el scope solicitado; no implementar roadmap futuro sin pedido explicito.
- No introducir dependencias sin una necesidad concreta.
- Mantener la logica de negocio fuera de React.
- Separar UI, dominio y persistencia.
- Todo cambio de comportamiento importante requiere tests.
- Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` antes de cerrar una tarea.
- Informar exactamente que archivos se modificaron.
- No ocultar errores ni usar fallbacks silenciosos ante estados invalidos.
- No modificar la arquitectura global sin justificarlo.
- Priorizar cambios pequenos y reversibles.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
