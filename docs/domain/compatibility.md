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

## Fuera de scope

No se modela compatibilidad por BIOS, chipset, cantidad de slots RAM, gabinete, GPU, conectores de fuente, calidad de fuente, certificacion, eficiencia, dimensiones fisicas ni consumo total. En particular, GPU/motherboard no se evalua todavia porque el catalogo no representa interfaz de GPU ni slot de expansion de motherboard.

La generacion PCIe por si sola no es una regla de incompatibilidad estructural: diferencias de generacion pueden afectar ancho de banda o rendimiento, pero no deben reportarse como error si la interfaz sigue siendo retrocompatible.
