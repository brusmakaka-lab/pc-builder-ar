# Builds Domain

`PcBuild` representa una build temporal en memoria. Puede estar incompleta: CPU, motherboard, GPU, RAM y PSU son selecciones independientes y pueden ser `null`.

## IDs vs objetos

La build guarda IDs de componentes, no objetos completos:

```ts
{
  cpuId: "cpu-amd-ryzen-5-7600",
  motherboardId: null,
  gpuId: "gpu-asus-prime-rtx-5070-oc",
  memoryKitId: null,
  psuId: null
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

La evaluacion conoce tres reglas:

- CPU/motherboard: `cpu.socket` debe coincidir con `motherboard.socket`.
- RAM/motherboard: `memoryKit.memoryType` debe coincidir con `motherboard.memoryType`.
- PSU/potencia: `psu.wattage` debe cubrir la potencia minima estimada para CPU y GPU.

Las reglas viven en `src/modules/compatibility/` y `evaluateBuild` solo las orquesta contra los IDs seleccionados. La UI consume `BuildEvaluation`; no decide compatibilidad por su cuenta.

La precedencia del estado global es:

- `incompatible` si al menos una regla evaluable falla.
- `unknown` si no hay fallas pero falta algun componente necesario para completar las reglas conocidas.
- `compatible` si todas las reglas conocidas pueden evaluarse y pasan.

La regla de potencia usa los watts ya modelados: `cpu.tdpWatts` y `gpu.boardPowerWatts`. La carga estimada es:

```text
estimatedLoadWatts = cpu.tdpWatts + gpu.boardPowerWatts
```

La potencia requerida aplica un margen simple del 25%:

```text
requiredPsuWatts = ceil(estimatedLoadWatts * 1.25)
```

Esta es una aproximacion de dominio para screening inicial: combina TDP de CPU y board power de GPU, no una medicion electrica real ni una recomendacion final de compra. Conectores, calidad de PSU, certificaciones, eficiencia, transients y estandares ATX quedan fuera de scope.

## GPU y motherboard

La compatibilidad estructural GPU/motherboard todavia no se evalua porque el catalogo actual no modela la interfaz de conexion de la GPU ni el slot de expansion de la motherboard.

El dato minimo faltante es un concepto tipado de conector/slot estructural, por ejemplo `PCIe x16`, en ambos componentes. Con el catalogo actual, agregar ese dato a todos los fixtures conocidos produciria solo combinaciones compatibles y un check que siempre devuelve compatible, sin valor de dominio.

La generacion PCIe no debe tratarse como incompatibilidad por defecto: una diferencia como PCIe 3.0 contra PCIe 4.0 pertenece a capacidad, ancho de banda o rendimiento, no a compatibilidad estructural, mientras exista retrocompatibilidad.

## Fuera de scope

No hay persistencia, builds guardadas, precios, tiendas, compatibilidad estructural GPU/motherboard, conectores de PSU, calidad de PSU, gabinete, cooling, benchmarks ni recomendaciones.
