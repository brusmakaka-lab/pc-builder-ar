# Catalog Domain

El catalogo representa componentes controlados en memoria para desarrollo y testing. No usa base de datos, tiendas, scraping ni precios.

## Componentes

- `Cpu`: marca, modelo, socket, nucleos, threads y TDP en watts.
- `Motherboard`: marca, modelo, socket, chipset, form factor, tipo de memoria y slots de memoria.
- `Gpu`: distingue fabricante/modelo de placa (`boardBrand`, `boardModel`) del chip grafico (`chipBrand`, `gpuModel`).
- `MemoryKit`: representa kits completos de RAM, no modulos individuales. Incluye tipo de memoria, capacidad total, cantidad de modulos y velocidad.

## Decisiones

Los IDs son strings estables y legibles, independientes del texto mostrado en UI. Las cantidades usan unidades explicitas (`tdpWatts`, `vramGb`, `capacityGb`, `speedMtS`, `lengthMm`) para evitar strings ambiguos.

Se usan unions solo para conjuntos cerrados del dataset inicial: sockets, tipos de memoria, form factors, marcas de CPU y marcas del chip de GPU. Las marcas de placas y modelos quedan como strings para no convertir el catalogo en una lista rigida innecesaria.

## Fuera de scope

No se modelan precios, disponibilidad, tiendas, historial, benchmarks, gabinetes, fuentes, 3D, afiliados ni persistencia. Esos limites se agregaran cuando el flujo lo requiera.
