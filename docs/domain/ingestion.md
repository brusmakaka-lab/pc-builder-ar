# Ingestion Domain

Ingestion es la frontera entre fuentes externas y el dominio de pricing.

Flujo:

```txt
fuente externa
raw ExternalOffer
normalizacion y validacion
IngestedComponentOffer
ComponentOffer
pricing
```

Pricing no depende de ingestion. Ingestion puede importar tipos de pricing para producir `ComponentOffer`, pero no al reves.

## OfferSource

Un provider no devuelve ofertas confiables. Devuelve datos raw:

```ts
type OfferSource = {
  readonly id: string;
  load(): Promise<ExternalOffer[]>;
};
```

`load()` es async porque fuentes futuras pueden usar I/O. En esta fase el provider demo es local y no hace HTTP, scraping ni llamadas externas.

## ExternalOffer

`ExternalOffer` representa datos observados en una fuente:

```ts
type ExternalOffer = {
  externalId: string;
  sourceId: string;
  sellerExternalId: string;
  componentReference: string;
  price: {
    amountMinor: number;
    currency: string;
  };
  observedAt: string;
};
```

Todavia no es una `ComponentOffer` confiable. `componentReference` y `sellerExternalId` son referencias externas y no se tratan como IDs internos.

## Mappings

El matching es explicito:

```ts
type ComponentReferenceMap = Readonly<Record<string, ComponentId>>;
type SellerReferenceMap = Readonly<Record<string, Seller["id"]>>;
```

No hay fuzzy matching, busqueda por producto, IA para matching ni creacion automatica de componentes. Si una referencia no esta mapeada, la oferta se rechaza.

## Provenance

Cada oferta aceptada conserva trazabilidad:

```ts
type OfferProvenance = {
  sourceId: string;
  externalOfferId: string;
  observedAt: string;
};
```

La provenance se mantiene junto a la oferta normalizada:

```ts
type IngestedComponentOffer = {
  offer: ComponentOffer;
  provenance: OfferProvenance;
};
```

No se agrego provenance a `ComponentOffer` para no cambiar la semantica del dominio de pricing. Si mas adelante hay persistencia, puede evaluarse incorporarla al modelo persistido.

## Normalizacion

`normalizeExternalOffer(externalOffer, componentMapping, sellerMapping)` es pura y sincrona.

Valida:

- `externalId` no vacio;
- `sourceId` no vacio;
- `componentReference` resoluble a `ComponentId`;
- `sellerExternalId` resoluble a seller interno;
- `price.amountMinor` entero y no negativo;
- `price.currency` soportada;
- `observedAt` como string ISO 8601 UTC exacto.

Si todo es valido, produce `ComponentOffer` con id deterministico:

```txt
external:{sourceId}:{externalId}
```

## Rechazos

Los rechazos usan codigos estables:

- `duplicate-external-offer`
- `invalid-external-id`
- `invalid-observed-at`
- `invalid-price`
- `invalid-source-id`
- `unknown-component`
- `unknown-seller`
- `unsupported-currency`

Los mensajes humanos son explicativos, no logica de dominio.

## Batch

`normalizeExternalOffers(...)` devuelve:

```ts
type OfferIngestionResult = {
  accepted: IngestedComponentOffer[];
  rejected: RejectedExternalOffer[];
};
```

El batch mantiene orden determinista. Una oferta invalida no aborta el resto.

Duplicados dentro del mismo batch:

- clave: `sourceId + externalId`;
- el primer accepted gana;
- duplicados posteriores se rechazan con `duplicate-external-offer`;
- un registro invalido previo no reserva la clave.

## Demo

`demoOfferSource` devuelve fixtures locales para probar el flujo sin internet:

- oferta valida;
- componente desconocido;
- seller desconocido;
- precio invalido;
- duplicado;
- otra moneda valida.

## Fuera de Scope

No hay `fetch()`, HTTP, scraping, browser automation, Playwright, Puppeteer, Cheerio, adapters de retailers reales, Mercado Libre, cron, persistencia, base de datos, historico de precios, dedupe historico, fuzzy matching, IA para matching, FX, impuestos, stock, cuotas ni actualizaciones periodicas.
