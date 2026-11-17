# PC Builder AR

Prototipo web para armar una PC, revisar compatibilidad técnica y comparar estrategias de compra con datos locales de demostración. Fuente más reciente localizada: **0.1.0**, base Git `425ec58` antes de preparar este respaldo.

## Funciones implementadas

- Selección de CPU, motherboard, GPU, kit de RAM, fuente, gabinete y cooler.
- Evaluación de socket CPU/motherboard y cooler, memoria/motherboard, conectores y potencia de la fuente, dimensiones GPU/gabinete, formato motherboard/gabinete y altura cooler/gabinete.
- Catálogo técnico separado de ofertas y vendedores.
- Dinero en enteros de unidades menores; ARS y USD se evalúan por separado, sin conversión de moneda.
- Comparación de compra mixta por componente, vendedor único y combinación optimizada incluyendo un envío por vendedor. Un envío desconocido mantiene el total efectivo desconocido.
- Frontera de ingestión con datos demo: validación, referencias explícitas, trazabilidad, rechazo de duplicados y motivos de error.
- Interfaz Next.js que ejecuta el dominio con fixtures locales y mantiene la build en memoria.

## Estado y límites

Los componentes, precios y vendedores de la demostración son fixtures; **no son cotizaciones actuales ni stock real**. No hay scraping, consultas a tiendas, pagos, autenticación, historial de precios ni persistencia de builds. El módulo `src/db` define el requisito de `DATABASE_URL` para acceso futuro; no implementa un backend productivo ni una base poblada.

El README inicial describía la base; esta documentación resume también las funciones agregadas en los 17 commits locales conservados. No se implementaron funciones nuevas para esta publicación.

## Stack

Next.js 16.3.1, React 19.2, TypeScript, Tailwind CSS, Zod y Vitest. PostgreSQL/Drizzle están previstos como límite de persistencia. Las versiones resueltas se conservan en `pnpm-lock.yaml`.

## Instalar y ejecutar

Requisitos del entorno verificado: Node.js 24 y pnpm 11.9.0. No hace falta una base de datos para explorar los fixtures de la pantalla actual.

```powershell
git clone https://github.com/brusmakaka-lab/pc-builder-ar.git
cd pc-builder-ar
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:3000`. Para un futuro acceso a base de datos, copia `.env.example` a `.env.local` y configura tu propia URL; no publiques credenciales. El ejemplo usa un servidor local ficticio.

## Comprobaciones

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

El resultado de la revisión de este respaldo se registra en [VALIDACION-GITHUB.md](VALIDACION-GITHUB.md). Las pruebas validan el dominio y los fixtures; no certifican precios ni catálogos externos.

## Estructura y documentación

```text
src/app/                     interfaz y estado en memoria
src/modules/catalog/         hardware y catálogo demo
src/modules/builds/          selección y evaluación de builds
src/modules/compatibility/   reglas puras de compatibilidad
src/modules/pricing/         dinero, ofertas, envíos y estrategias
src/modules/ingestion/       normalización y validación de ofertas demo
src/db/                      límite de persistencia
docs/                        alcance, arquitectura y decisiones
```

Lee [arquitectura](docs/architecture/overview.md), [compatibilidad](docs/domain/compatibility.md), [pricing](docs/domain/pricing.md) e [ingestión](docs/domain/ingestion.md). Algunos documentos de alcance inicial conservan la propuesta histórica; el código y las pruebas muestran el avance actual.

## Respaldo y recuperación

Se conserva el historial Git local y se agrega únicamente documentación de publicación. Se incluyen código, configuración, recursos de `public/`, pruebas, ejemplo de entorno y lockfile. No se incluyen `node_modules`, `.next`, credenciales, bases ni artefactos de TypeScript.

Para recuperar el proyecto, clona el repositorio, instala desde el lockfile y ejecuta los controles anteriores. La build de demostración vive en memoria y no se guarda como datos personales en este respaldo.
