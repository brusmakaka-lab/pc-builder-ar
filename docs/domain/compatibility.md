# Compatibility Domain

El modulo de compatibilidad concentra reglas puras entre componentes del catalogo. No importa React, no accede a base de datos y no depende de fixtures globales.

## Regla implementada

La unica regla activa es CPU contra motherboard:

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

## Fuera de scope

No se modela compatibilidad por BIOS, chipset, RAM, gabinete, GPU, fuente, dimensiones fisicas ni consumo total. Esas reglas se agregaran cuando el flujo lo requiera.
