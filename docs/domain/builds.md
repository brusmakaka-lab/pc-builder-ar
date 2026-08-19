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

Una build puede conservar selecciones incompatibles. La compatibilidad CPU/motherboard se evalua usando la regla existente de `src/modules/compatibility/cpu-motherboard.ts`. Las incompatibilidades se reportan como issues, no se corrigen automaticamente.

## Fuera de scope

No hay persistencia, builds guardadas, precios, tiendas, compatibilidad de GPU/RAM, fuente, gabinete, cooling, benchmarks ni recomendaciones.
