# Builds Domain

`PcBuild` representa una build temporal en memoria. Puede estar incompleta: CPU, motherboard, GPU y RAM son selecciones independientes y pueden ser `null`.

## IDs vs objetos

La build guarda IDs de componentes, no objetos completos:

```ts
{
  cpuId: "cpu-amd-ryzen-5-7600",
  motherboardId: null,
  gpuId: "gpu-asus-prime-rtx-5070-oc",
  memoryKitId: null
}
```

Esta decision evita duplicar datos del catalogo, facilita persistencia futura y permite reemplazar fixtures por base de datos sin cambiar el modelo de build.

## Operaciones

El modulo expone operaciones pequenas e inmutables para crear una build vacia, seleccionar o limpiar cada posicion. Cada operacion devuelve una nueva build y no muta la instancia recibida.

## Evaluacion

`BuildEvaluation` representa hechos derivados de una `PcBuild` y del catalogo actual:

- `completion`: `empty`, `partial` o `complete`.
- `compatibility`: `unknown`, `compatible` o `incompatible`.
- `missingComponents`: slots faltantes en orden determinista.
- `issues`: problemas detectados con codigo estable y severidad.

La evaluacion no modifica la build ni el catalogo. Seleccion y evaluacion son responsabilidades separadas.

## Compatibilidad

Una build puede conservar selecciones incompatibles. Las incompatibilidades se reportan como issues, no se corrigen automaticamente.

La evaluacion conoce dos reglas:

- CPU/motherboard: `cpu.socket` debe coincidir con `motherboard.socket`.
- RAM/motherboard: `memoryKit.memoryType` debe coincidir con `motherboard.memoryType`.

Las reglas viven en `src/modules/compatibility/` y `evaluateBuild` solo las orquesta contra los IDs seleccionados. La UI consume `BuildEvaluation`; no decide compatibilidad por su cuenta.

La precedencia del estado global es:

- `incompatible` si al menos una regla evaluable falla.
- `unknown` si no hay fallas pero falta algun componente necesario para completar las reglas conocidas.
- `compatible` si todas las reglas conocidas pueden evaluarse y pasan.

## Fuera de scope

No hay persistencia, builds guardadas, precios, tiendas, compatibilidad de GPU con otros componentes, fuente, gabinete, cooling, benchmarks ni recomendaciones.
