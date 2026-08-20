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

## Shipping

Shipping se modela como dato separado del vendedor y de la oferta:

```ts
type SellerShippingQuote = {
  sellerId: string;
  price: Money;
};
```

La semantica de esta fase es fija y deterministica:

- el costo se cobra una sola vez por pedido a cada seller usado;
- dos componentes comprados al mismo seller pagan un solo shipping;
- mixed cheapest suma el shipping de cada seller distinto usado;
- `amountMinor = 0` es envio gratis explicito;
- ausencia de quote en la moneda solicitada significa shipping desconocido;
- una quote en otra moneda se ignora y no dispara conversion FX.

La ausencia de dato nunca se interpreta como cero. Si un seller usado no tiene shipping conocido, `shippingStatus = "unknown"` y el costo efectivo final queda en `null`.

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

## Purchase Strategy Comparison

`evaluateBuildPurchaseComparison(build, offers, sellers, currency, shippingQuotes)` compara dos estrategias de compra sobre la misma build y la misma moneda.

Cada estrategia expone un costo:

```ts
type PurchaseCost = {
  componentSubtotal: Money;
  shippingTotal: Money | null;
  effectiveTotal: Money | null;
  shippingStatus: "known" | "unknown";
};
```

`componentSubtotal + shippingTotal = effectiveTotal` solo cuando el pricing de componentes esta completo y el shipping de todos los sellers usados es conocido.

### Mixed cheapest

`mixedCheapest` reutiliza `evaluateBuildPricing`. Para cada componente seleccionado elige la oferta mas barata disponible en la moneda solicitada, aunque eso mezcle vendedores distintos.

La seleccion de ofertas mixed se hace por precio puro de componente antes de mirar shipping. Luego se determinan los `sellerIdsUsed`, ordenados por `sellerId`, y se suma una sola quote de shipping por seller usado.

No hay optimizacion combinatoria. La fase no prueba combinaciones alternativas para minimizar `componentSubtotal + shippingTotal`; eso queda fuera de alcance. Por eso mixed puede pagar mas shipping que una tienda unica.

### Single seller

`singleSellerOptions` evalua cada vendedor relevante filtrando primero sus ofertas. Una opcion de vendedor unico nunca mezcla ofertas de otros vendedores.

Un vendedor es relevante si tiene al menos una oferta en la moneda solicitada para alguno de los componentes seleccionados. Las opciones se ordenan por `seller.name` y luego por `seller.id` para mantener salida estable.

Un seller completo con shipping conocido tiene `effectiveTotal = componentSubtotal + shippingTotal`. Si el seller esta completo pero su shipping es desconocido, `effectiveTotal = null`.

`cheapestCompleteSingleSellerByComponents` preserva la lectura por subtotal de componentes. `cheapestCompleteSingleSellerByEffectiveCost` y `cheapestCompleteSingleSeller` priorizan costo efectivo.

Las opciones `partial`, `unpriced` o con shipping desconocido no pueden ganar la recomendacion efectiva. El desempate de costo efectivo es:

1. menor `effectiveTotal`
2. menor `componentSubtotal`
3. menor `sellerId` lexicograficamente

`differenceFromMixed` es `singleSeller.total - mixedCheapest.total` en la misma moneda. Si falta alguno de los totales, queda en `null`.

`effectiveDifferenceFromMixed` es `singleSeller.effectiveTotal - mixedCheapest.effectiveTotal`. Puede ser negativo: una tienda unica puede ganar contra mixed si mixed usa varios vendedores y paga mas envios.

Una build vacia mantiene `mixedCheapest` como pricing completo con `componentSubtotal = 0`, `shippingTotal = 0` y `effectiveTotal = 0`, pero no genera opciones de vendedor unico y `cheapestCompleteSingleSeller = null`.

## Fuera de scope

No se modelan APIs de retailers, scraping, FX, impuestos, cuotas, envios, stock, disponibilidad geografica, historicos, usados, marketplaces, alertas, descuentos complejos, bundles, recomendaciones, checkout, persistencia ni backend.
