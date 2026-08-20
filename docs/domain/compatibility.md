# Compatibility Domain

El modulo de compatibilidad concentra reglas puras entre componentes del catalogo. No importa React, no accede a base de datos y no depende de fixtures globales.

## Reglas implementadas

CPU contra motherboard:

```text
cpu.socket === motherboard.socket
```

Si los sockets coinciden, el resultado es compatible. Si no coinciden, el resultado es incompatible con un motivo tipado:

```ts
{ compatible: true }
```

```ts
{
  compatible: false,
  reason: {
    code: "SOCKET_MISMATCH",
    cpuSocket: "AM4",
    motherboardSocket: "AM5"
  }
}
```

RAM contra motherboard:

```text
memoryKit.memoryType === motherboard.memoryType
```

Si los tipos de memoria coinciden, el resultado es compatible. Si no coinciden, el resultado es incompatible con un motivo tipado:

```ts
{ compatible: true }
```

```ts
{
  compatible: false,
  reason: {
    code: "MEMORY_TYPE_MISMATCH",
    memoryType: "DDR4",
    motherboardMemoryType: "DDR5"
  }
}
```

PSU contra potencia estimada:

```text
estimatedLoadWatts = cpu.tdpWatts + gpu.boardPowerWatts
requiredPsuWatts = ceil(estimatedLoadWatts * 1.25)
psu.wattage >= requiredPsuWatts
```

Si la potencia nominal de la PSU cubre la potencia requerida estimada, el resultado es compatible. Si no la cubre, el resultado es incompatible con un motivo tipado:

```ts
{
  compatible: false,
  reason: {
    code: "INSUFFICIENT_WATTAGE",
    psuWattage: 400,
    estimatedLoadWatts: 375,
    requiredPsuWatts: 469
  }
}
```

GPU contra conectores de PSU:

```text
gpu.powerConnectors[] debe poder asignarse contra psu.gpuPowerConnectors[]
```

La regla de conectores es independiente de la regla de watts. Si faltan conectores dedicados para la GPU, el resultado es incompatible aunque la potencia nominal alcance:

```ts
{
  compatible: false,
  reason: {
    code: "MISSING_GPU_POWER_CONNECTORS",
    missingConnectors: [{ type: "pcie-8", count: 1 }]
  }
}
```

Una GPU con `powerConnectors: []` no requiere alimentacion dedicada y pasa este check cuando la PSU esta seleccionada.

`pcie-6-plus-2` representa una capacidad de PSU que puede cubrir un requisito `pcie-6` o `pcie-8`, pero un conector no cubre dos requisitos simultaneos. No hay adaptadores implicitos: multiples `pcie-8` no equivalen a `12vhpwr`, y `12vhpwr`/`12v-2x6` no se convierten automaticamente.

## Fuera de scope

No se modela compatibilidad por BIOS, chipset, cantidad de slots RAM, gabinete, GPU/motherboard, conectores CPU EPS, conectores ATX motherboard, SATA, Molex, adapters, splitters, daisy-chain, calidad de fuente, certificacion, eficiencia, dimensiones fisicas ni consumo total. En particular, GPU/motherboard no se evalua todavia porque el catalogo no representa interfaz de GPU ni slot de expansion de motherboard.

La generacion PCIe por si sola no es una regla de incompatibilidad estructural: diferencias de generacion pueden afectar ancho de banda o rendimiento, pero no deben reportarse como error si la interfaz sigue siendo retrocompatible.
