# Validación para GitHub

Fecha: 16/11/2026. Fuente 0.1.0 desde el commit local `425ec58`; se conservan los **17 commits** originales. La preparación agrega un commit con cambios únicamente en `README.md` y este archivo; la aplicación no cambió.

## Controles en la copia aislada de E:

- Instalación desde `pnpm-lock.yaml`: pnpm 11.9.0, `--frozen-lockfile --ignore-scripts`, store en E:.
- `pnpm lint`: aprobado.
- `pnpm typecheck`: aprobado.
- `pnpm test`: **229/229**, 15 archivos de pruebas.
- `pnpm build`: aprobado con Next.js 16.3.1/Turbopack, rutas estáticas `/` y `/_not-found`.

Se usaron fixtures locales, sin consultas a tiendas ni a una base productiva. No se validaron cotizaciones ni disponibilidad de hardware. El aviso de antigüedad de baseline-browser-mapping no impidió el build; no se actualizaron dependencias para modificarlo.

Archivos modificados para publicar: `README.md`, `VALIDACION-GITHUB.md`. Código, configuración y lockfile originales conservados. Las carpetas de dependencias, `.next`, variables privadas y artefactos generados quedan fuera del respaldo público.
