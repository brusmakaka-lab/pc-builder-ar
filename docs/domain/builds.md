# Builds Domain

`PcBuild` representa una build temporal en memoria. Puede estar incompleta: CPU, CPU cooler, motherboard, GPU, RAM, PSU y gabinete son selecciones independientes y pueden ser `null`.

## IDs vs objetos

La build guarda IDs de componentes, no objetos completos:

```ts
{
  cpuId: "cpu-amd-ryzen-5-7600",
  cpuCoolerId: null,
  motherboardId: null,
  gpuId: "gpu-asus-prime-rtx-5070-oc",
  memoryKitId: null,
  psuId: null,
  caseId: null
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

La evaluacion conoce ocho reglas:

- CPU/motherboard: `cpu.socket` debe coincidir con `motherboard.socket`.
- RAM/motherboard: `memoryKit.memoryType` debe coincidir con `motherboard.memoryType`.
- PSU/potencia: `psu.wattage` debe cubrir la potencia minima estimada para CPU y GPU.
- GPU/PSU conectores: la PSU debe poder asignar conectores de alimentacion dedicada para todos los requerimientos de la GPU.
- Motherboard/gabinete: `motherboard.formFactor` debe estar listado en `pcCase.supportedMotherboardFormFactors`.
- GPU/gabinete: `gpu.lengthMm` debe ser menor o igual a `pcCase.maxGpuLengthMm`.
- CPU/CPU cooler: `cpu.socket` debe estar listado en `cpuCooler.supportedSockets`.
- CPU cooler/gabinete: `cpuCooler.heightMm` debe ser menor o igual a `pcCase.maxCpuCoolerHeightMm`.

Las reglas viven en `src/modules/compatibility/` y `evaluateBuild` solo las orquesta contra los IDs seleccionados. La UI consume `BuildEvaluation`; no decide compatibilidad por su cuenta.

La precedencia del estado global es:

- `incompatible` si al menos una regla evaluable falla.
- `unknown` si no hay fallas pero falta algun componente necesario para completar las reglas conocidas.
- `compatible` si todas las reglas conocidas pueden evaluarse y pasan.

La regla de potencia usa los watts ya modelados: `cpu.tdpWatts` y `gpu.boardPowerWatts`, mas una constante conservadora para el consumo no modelado del sistema:

```text
SYSTEM_BASE_POWER_WATTS = 100
estimatedLoadWatts = cpu.tdpWatts + gpu.boardPowerWatts + SYSTEM_BASE_POWER_WATTS
```

La potencia requerida aplica un margen simple del 25%:

```text
PSU_HEADROOM_RATIO = 1.25
requiredPsuWatts = ceil(estimatedLoadWatts * PSU_HEADROOM_RATIO)
```

Esta es una aproximacion de dominio para screening inicial: combina TDP de CPU y board power de GPU como proxies, agrega 100 W para motherboard, RAM, almacenamiento, ventiladores y otros consumos no modelados, y no pretende ser una medicion electrica real. El margen conservador evita aceptar fuentes artificialmente justas para decisiones de compra iniciales. Calidad de PSU, certificaciones, eficiencia, transients y estandares ATX quedan fuera de scope.

El check de conectores GPU/PSU es independiente del check de potencia. Una PSU puede fallar potencia, conectores o ambos, y cada incompatibilidad se reporta como issue separado.

Los conectores se modelan como requisitos/capacidades estructuradas `{ type, count }`. `powerConnectors: []` en una GPU significa que no requiere alimentacion dedicada y el check de conectores pasa cuando hay GPU y PSU seleccionadas.

Una capacidad `pcie-6-plus-2` de la PSU puede alimentar un requisito `pcie-6` o `pcie-8`, pero un conector disponible solo puede cubrir un requisito. No se modelan adaptadores: multiples PCIe 8-pin no satisfacen automaticamente un requisito `12vhpwr`, y `12vhpwr`/`12v-2x6` no se convierten entre si.

El check motherboard/gabinete usa form factors explicitos. No infiere jerarquias: un gabinete que declara solo `ATX` no acepta automaticamente `MicroATX` salvo que `MicroATX` figure en `supportedMotherboardFormFactors`.

El check GPU/gabinete compara milimetros exactos. Si `gpu.lengthMm` es igual a `pcCase.maxGpuLengthMm`, la GPU se considera compatible. No se agrega margen oculto.

El check CPU/CPU cooler usa sockets soportados explicitos y reutiliza `CpuSocket`. No infiere compatibilidad por chipset, generacion ni marca.

El check CPU cooler/gabinete compara milimetros exactos. Si `cpuCooler.heightMm` es igual a `pcCase.maxCpuCoolerHeightMm`, el cooler se considera compatible. No se agrega margen oculto.

## GPU y motherboard

La compatibilidad estructural GPU/motherboard todavia no se evalua porque el catalogo actual no modela la interfaz de conexion de la GPU ni el slot de expansion de la motherboard.

El dato minimo faltante es un concepto tipado de conector/slot estructural, por ejemplo `PCIe x16`, en ambos componentes. Con el catalogo actual, agregar ese dato a todos los fixtures conocidos produciria solo combinaciones compatibles y un check que siempre devuelve compatible, sin valor de dominio.

La generacion PCIe no debe tratarse como incompatibilidad por defecto: una diferencia como PCIe 3.0 contra PCIe 4.0 pertenece a capacidad, ancho de banda o rendimiento, no a compatibilidad estructural, mientras exista retrocompatibilidad.

## Fuera de scope

No hay persistencia, builds guardadas, precios, tiendas, compatibilidad estructural GPU/motherboard, conectores CPU EPS, conectores ATX motherboard, SATA, Molex, calidad de PSU, grosor de GPU, AIO, radiadores, posiciones de montaje, RAM clearance, VRM clearance, rendimiento termico, ruido, RPM, bahias, cable clearance, benchmarks ni recomendaciones.
