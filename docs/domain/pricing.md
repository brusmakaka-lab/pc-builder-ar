# Pricing Domain

El dominio de pricing esta separado del catalogo tecnico. Los componentes describen hardware; las ofertas describen precios disponibles para un `ComponentId`.

## Money

`Money` usa enteros:

```ts
type Currency = "ARS" | "USD";

type Money = {
  amountMinor: number;
  currency: Currency;
};
```

`amountMinor` representa centavos para todas las monedas soportadas en esta fase.

- ARS 150000,00 => `amountMinor = 15000000`
- USD 99,99 => `amountMinor = 9999`

Los calculos no usan floating point. El formateo visual puede dividir por 100 para mostrar valores con `Intl.NumberFormat`, pero esa conversion no participa en calculos de dominio.

## Offers

`ComponentOffer` referencia componentes por `componentId` y no duplica datos tecnicos:

```ts
type ComponentOffer = {
  id: string;
  componentId: ComponentId;
  sellerId: string;
  price: Money;
};
```

`Seller` se mantiene minimo: `id` y `name`. No hay URLs, stock, envios, ubicacion, rating ni checkout.

## Seleccion de oferta

La estrategia temporal es determinista:

1. Filtrar ofertas por `componentId`.
2. Filtrar por moneda solicitada.
3. Elegir la oferta con menor `price.amountMinor`.
4. Si hay empate exacto, elegir el `id` lexicograficamente menor.

No se comparan monedas y no existe conversion FX. Una oferta USD se ignora cuando el pricing se pide en ARS, y viceversa.

## Build Pricing

`evaluateBuildPricing(build, offers, currency)` calcula pricing para los componentes seleccionados, aunque la build este incompleta.

El orden de items y faltantes sigue el orden conceptual de build:

1. CPU
2. Motherboard
3. GPU
4. RAM
5. PSU
6. Gabinete
7. CPU cooler

`pricedSubtotal` suma los componentes seleccionados que si tienen oferta en la moneda solicitada.

`total` solo existe cuando todos los componentes seleccionados tienen precio. Si falta algun precio, `total = null` para no presentar el subtotal como costo final.

Estados:

- `complete`: no hay componentes seleccionados sin precio. Una build vacia es `complete` con total cero.
- `partial`: algunos componentes seleccionados tienen precio y otros no.
- `unpriced`: hay componentes seleccionados, pero ninguno tiene oferta en la moneda solicitada.

Pricing no se integra en `BuildEvaluation`. Compatibilidad responde si la build funciona; pricing responde cuanto cuesta segun las ofertas disponibles.

## Fuera de scope

No se modelan APIs de retailers, scraping, FX, impuestos, cuotas, envios, stock, disponibilidad geografica, historicos, usados, marketplaces, alertas, descuentos complejos, bundles, recomendaciones, checkout, persistencia ni backend.
