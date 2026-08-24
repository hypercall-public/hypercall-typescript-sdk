# Hypercall TypeScript SDK

A TypeScript SDK for Hypercall API consumers.

The package exposes:

- **Transport:** `HttpTransport`
- **Clients:** `InfoClient`, `ExchangeClient`
- **Low-level methods:** `@hypercall/sdk/api/info`, `@hypercall/sdk/api/exchange`
- **Signing helpers:** `@hypercall/sdk/signing`
- **Types:** request, response, and domain types for the exported API methods

## Installation

```bash
pnpm add @hypercall/sdk
```

For local tarball testing before the package is published:

```bash
cd hypercall-typescript-sdk
deno task pack:npm

cd ../your-app
pnpm add ../hypercall-typescript-sdk/dist/hypercall-sdk-*.tgz
```

This installs the same package shape npm consumers receive.

## Quick Start

```ts
import { HttpTransport, InfoClient } from "@hypercall/sdk";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const markets = await info.markets({ include_instruments: false });

console.log(markets.data[0]?.underlying);
```

`HttpTransport` defaults to `https://api.hypercall.xyz`. Apps that target a specific deploy should pass `apiUrl` from
their own config.

```ts
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
```

## Info API Examples

Request params come first, and the optional `AbortSignal` comes last.

Focused runnable examples live in `examples/`:

- `exchange-metadata.ts`
- `read-markets.ts`
- `read-wallet.ts`
- `account-activity.ts`
- `public-trades.ts`
- `profile.ts`
- `withdrawal-status.ts`
- `rfq-status.ts`
- `historical-theos.ts`
- `liquidations.ts`
- `signing.ts`
- `pre-signed-writes.ts`

The read examples call live API endpoints. `signing.ts` and `pre-signed-writes.ts` are request-shape examples and do not
submit write actions by default.

Run an example with:

```bash
deno task example examples/read-markets.ts
```

```ts
import { HttpTransport, InfoClient } from "@hypercall/sdk";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const controller = new AbortController();

const summaries = await info.optionSummaries(
  {
    currency: "SPCX",
    includeRfqProviderQuotes: true,
    rfqProviderQuotesLimit: 5,
  },
  controller.signal,
);

console.log(summaries.result?.[0]?.instrument_name);
console.log(summaries.result?.[0]?.rfq_provider_quotes?.[0]?.wallet);
```

## Exchange API Examples

Exchange methods mutate state and currently accept pre-signed request payloads. The SDK submits and validates the
request shape, while the caller owns wallet connection, nonce selection, and EIP-712 signing.

Place order note: `route` is part of the signed `PlaceOrder` payload and must match the `route` field sent to the API.
Reduce-only place and replace requests must use the matching `PlaceOrderReduceOnly` or `ReplaceOrderReduceOnly` signing
type and send `reduce_only: true`.

```ts
import { ExchangeClient, HttpTransport } from "@hypercall/sdk";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const exchange = new ExchangeClient({ transport });

const response = await exchange.setSettlementPayoutsSeen({
  wallet: "0x0000000000000000000000000000000000000000",
  ids: [123],
  nonce: 1,
  signature: "0x...",
});

console.log(response.success);
console.log(response.affected);
```

```ts
const approved = await exchange.approveAgent({
  agent: "0x0000000000000000000000000000000000000000",
  nonce: 1,
  signature: "0x...",
});

console.log(approved.success);
```

```ts
const placed = await exchange.placeOrder({
  wallet: "0x0000000000000000000000000000000000000000",
  symbol: "BTC-30JUN26-100000-C",
  side: "Buy",
  size: "0.1",
  price: "100",
  tif: "gtc",
  route: "best_execution",
  client_id: "client-123",
  nonce: 2,
  signature: "0x...",
});

console.log(placed.status);
```

```ts
const replaced = await exchange.replaceOrder({
  wallet: "0x0000000000000000000000000000000000000000",
  order_id: 123,
  symbol: "BTC-30JUN26-100000-C",
  side: "Buy",
  size: "0.1",
  price: "101",
  tif: "gtc",
  client_id: "client-124",
  nonce: 3,
  signature: "0x...",
});

console.log(replaced.status);
```

```ts
const marginMode = await exchange.setMarginMode({
  wallet: "0x0000000000000000000000000000000000000000",
  margin_mode: "standard",
  nonce: 4,
  signature: "0x...",
});

console.log(marginMode.success);
```

```ts
const canceled = await exchange.cancelOrder({
  wallet: "0x0000000000000000000000000000000000000000",
  order_id: 123,
  nonce: 5,
  signature: "0x...",
});

console.log(canceled.success);
```

```ts
const bulkCanceled = await exchange.bulkCancelOrdersByClientId({
  cancels: [{
    wallet: "0x0000000000000000000000000000000000000000",
    client_id: "client-123",
    nonce: 6,
    signature: "0x...",
  }],
});

console.log(bulkCanceled.results[0]?.success);
```

```ts
const revoked = await exchange.revokeAllAgents({
  nonce: 7,
  signature: "0x...",
});

console.log(revoked.success);
```

Referral write signatures cover the exact `code` string submitted in the request. The API normalizes the stored code
only after authentication.

```ts
const referralCode = await exchange.createReferralCode({
  wallet: "0x0000000000000000000000000000000000000000",
  code: "ALPHA",
  nonce: 8,
  signature: "0x...",
});

console.log(referralCode.code);
```

## Signing Helpers

The signing subpath exposes EIP-712 maps and value builders for public SDK write actions. Product-local profile,
username, and notification helpers live in the Hypercall frontend instead of this package. Pass the chain id from your
app environment.

```ts
import { APPROVE_AGENT_TYPES, buildApproveAgentValue, buildTypedData } from "@hypercall/sdk/signing";

const message = buildApproveAgentValue(
  "0x0000000000000000000000000000000000000000",
  1,
);

const typedData = buildTypedData({
  chainId: 999,
  primaryType: "ApproveAgent",
  types: APPROVE_AGENT_TYPES,
  message,
});

console.log(typedData.primaryType);
```

```ts
import { buildPlaceOrderValue, buildTypedData, PLACE_ORDER_TYPES } from "@hypercall/sdk/signing";

const order = buildPlaceOrderValue({
  wallet: "0x0000000000000000000000000000000000000000",
  symbol: "BTC-30JUN26-100000-C",
  side: "Buy",
  size: "0.1",
  price: "100",
  tif: "gtc",
  route: "book_only",
  clientId: "client-123",
  nonce: 2,
});

const orderTypedData = buildTypedData({
  chainId: 999,
  primaryType: "PlaceOrder",
  types: PLACE_ORDER_TYPES,
  message: order,
});

console.log(orderTypedData.message.route);
```

### Exchange Metadata

```ts
const exchange = await info.exchangeInfo();

console.log(exchange.exchange_address);
console.log(exchange.chain_id);
console.log(exchange.signing_domain.name);
```

### Markets

```ts
const slimMarkets = await info.markets({ include_instruments: false });
const fullMarkets = await info.markets();

console.log(slimMarkets.data[0]?.underlying);
console.log(fullMarkets.data[0]?.instruments[0]?.id);
```

### Instruments

```ts
const instruments = await info.instruments({ currency: "SPCX" });

console.log(instruments.result?.[0]?.instrument_id);
console.log(instruments.result?.[0]?.instrument_name);
```

### Option Summaries

```ts
const summaries = await info.optionSummaries({
  currency: "SPCX",
  includeRfqProviderQuotes: true,
  rfqProviderQuotesLimit: 5,
});

console.log(summaries.result?.[0]?.mark_price);
console.log(summaries.result?.[0]?.greeks?.delta);
console.log(summaries.result?.[0]?.rfq_provider_quotes?.length ?? 0);
```

### Orderbook

```ts
const instruments = await info.instruments({ currency: "SPCX" });
const instrument = instruments.result?.[0];

if (instrument) {
  const book = await info.orderbook({
    instrumentId: instrument.instrument_id,
    depth: 15,
  });

  console.log(book.result?.bids[0]);
  console.log(book.result?.asks[0]);
}
```

### Portfolio

```ts
const portfolio = await info.portfolio({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
});

console.log(portfolio.data?.available_balance);
console.log(portfolio.data?.positions[0]?.symbol);
```

### Profile

```ts
const profile = await info.profile({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
});

console.log(profile.data.username);
console.log(profile.data.account_wallet);
console.log(profile.data.pnl.unrealized);

const profileTrades = await info.profileTrades({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 25,
  offset: 0,
});

console.log(profileTrades.data[0]?.trade_id);
console.log(profileTrades.data[0]?.realized_pnl);

const realizedPnl = await info.profileRealizedPnl({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  from_ts_ms: 1_700_000_000_000,
  to_ts_ms: 1_700_086_400_000,
});

console.log(realizedPnl.data[0]?.symbol);
console.log(realizedPnl.data[0]?.realized_pnl);
```

### Orders

```ts
const orders = await info.orders({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 25,
});

console.log(orders.data[0]?.order_id);
console.log(orders.pagination.count);

const orderStatus = await info.orderStatus({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  orderId: "client-order-123",
});

console.log(orderStatus.data?.status);
```

### Fills

```ts
const fills = await info.fills({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 25,
});

console.log(fills.data[0]?.fill_id);
console.log(fills.data[0]?.side);
```

### Public Trades

```ts
const trades = await info.trades({
  underlying: "BTC",
  limit: 25,
  offset: 0,
});

console.log(trades.data[0]?.trade_id);
console.log(trades.data[0]?.price);
console.log(trades.data[0]?.taker_side);

const nextTrades = trades.data[0]
  ? await info.trades({ after_trade_id: trades.data[0].trade_id, limit: 25 })
  : undefined;

const exactTrade = trades.data[0] ? await info.trade({ tradeId: trades.data[0].trade_id }) : undefined;

console.log(nextTrades?.data.length);
console.log(exactTrade?.data.trade_id);

const accountTrades = await info.trades({
  account: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 25,
  offset: 0,
});

console.log(accountTrades.data[0]?.maker_address);
console.log(accountTrades.data[0]?.taker_address);
```

### Settlement Payouts and Authorized Agents

```ts
const payouts = await info.settlementPayouts({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 25,
});

console.log(payouts.data[0]?.symbol);
console.log(payouts.pagination.count);

const agents = await info.authorizedAgents({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
});

console.log(agents.agents[0]);
```

### Risk, Referrals, and Transfers

```ts
const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";

const risk = await info.riskGrid({ wallet });
const binding = await info.referralBinding({ wallet });
const ownedCode = await info.referralCodeByOwner({ wallet });
const transfers = await info.transfers({
  wallet,
  transactionTypes: ["deposit", "withdrawal"],
  statuses: ["completed"],
  limit: 25,
});

console.log(risk.data?.total_initial_margin);
console.log(binding.referrer_wallet);
console.log(ownedCode?.code);
console.log(transfers.page.next_cursor);
```

### Historical Theos

```ts
const history = await info.historicalTheos({
  instrumentName: "SPCX-20261231-10-C",
  interval: "1h",
  limit: 48,
});

console.log(history.data?.points[0]?.theoretical_price);

const batch = await info.historicalTheosBatch({
  instrumentNames: ["SPCX-20261231-10-C", "SPCX-20261231-12-C"],
  interval: "1h",
  limit: 48,
});

console.log(batch.data?.["SPCX-20261231-10-C"]?.points.length);
```

### Historical PnL

```ts
const pnl = await info.historicalPnl({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  interval: "1h",
  limit: 24,
});

console.log(pnl.data?.points[0]?.equity);
console.log(pnl.data?.points[0]?.net_deposits);
```

### Withdrawal Status

```ts
const withdrawals = await info.withdrawalHistory({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 5,
});

const latest = withdrawals.withdrawals[0];

if (latest) {
  const status = await info.directiveStatus({
    directiveId: latest.directive_id,
  });

  console.log(status.delivery_status);
  console.log(status.tx_hash);
}
```

### RFQ Status

```ts
const rfq = await info.rfqStatus({
  rfqId: "00000000-0000-0000-0000-000000000000",
});

console.log(rfq.status);
console.log(rfq.quotes[0]?.quote_id);
```

### Liquidations

```ts
const status = await info.liquidationStatus({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
});

console.log(status.data?.state);
console.log(status.data?.shortfall);

const history = await info.liquidationHistory({
  wallet: "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e",
  limit: 20,
  offset: 0,
});

console.log(history.data[0]?.new_state);

const publicLiquidations = await info.liquidations({
  limit: 50,
  status: "in_liquidation",
  marginMode: "standard",
  liquidationMode: "full",
});

console.log(publicLiquidations.data[0]?.auction_id);
```

## Low-Level Method Imports

Low-level methods are available from `@hypercall/sdk/api/info` for direct, tree-shakeable access.

```ts
import { HttpTransport } from "@hypercall/sdk";
import { markets } from "@hypercall/sdk/api/info";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });

const response = await markets(
  { transport },
  { include_instruments: false },
);

console.log(response.data[0]?.underlying);
```

## Response Envelopes

Different Hypercall endpoints return different envelope shapes. Keep the envelope when typing app code instead of
assuming every endpoint returns a raw array.

- **REST list envelopes:** `markets`, `orders`, `fills`, `trades`, `profileTrades`, `settlementPayouts`,
  `liquidationHistory`, and `liquidations` return `{ success, data }`. `orders`, `fills`, `trades`, `profileTrades`,
  `settlementPayouts`, and `liquidationHistory` also include `pagination`. `liquidations` includes cursor pagination in
  `page`.
- **JSON-RPC envelopes:** `instruments`, `optionSummaries`, and `orderbook` return
  `{ jsonrpc, result, error, testnet, usDiff, usIn, usOut }`.
- **API success envelope:** `portfolio`, `profile`, `historicalTheos`, `historicalTheosBatch`, `historicalPnl`,
  `liquidationStatus`, `riskGrid`, and `trade` return `{ success, data, error }`.
- **Transfer envelope:** `transfers` returns `{ success, data, page, error }` with cursor pagination.
- **Authorized agents and withdrawals:** `authorizedAgents` returns `{ agents }`; `withdrawalHistory` returns
  `{ withdrawals }`.
- **Direct objects:** `exchangeInfo`, `directiveStatus`, `rfqStatus`, and referral reads return their response objects
  directly.

Useful root-level types:

```ts
import type {
  AuthorizedAgentsResponse,
  DirectiveStatusResponse,
  ExchangeInfoResponse,
  Fill,
  FillsResponse,
  HistoricalPnlData,
  HistoricalPnlPoint,
  HistoricalPnlResponse,
  HistoricalTheoData,
  HistoricalTheoInterval,
  HistoricalTheoPoint,
  HistoricalTheosBatchResponse,
  HistoricalTheosResponse,
  Instrument,
  InstrumentsResponse,
  LiquidationHistoryEntry,
  LiquidationHistoryResponse,
  LiquidationsResponse,
  LiquidationStatusData,
  LiquidationStatusResponse,
  Market,
  MarketInstrument,
  MarketSlim,
  MarketsResponse,
  MarketsSlimResponse,
  OptionSummariesResponse,
  OptionSummary,
  Order,
  OrderBook,
  OrderbookResponse,
  Portfolio,
  PortfolioResponse,
  ProfileData,
  ProfileResponse,
  ProfileTrade,
  ProfileTradesResponse,
  RealizedPnlResponse,
  RealizedPnlRow,
  ReferralBinding,
  ReferralCode,
  ReferredWalletsResponse,
  RfqQuote,
  RfqStatusResponse,
  RiskGridResponse,
  SettlementPayout,
  SettlementPayoutsResponse,
  Trade,
  TradeResponse,
  TradesResponse,
  TransfersResponse,
  WithdrawalHistoryResponse,
} from "@hypercall/sdk";
```

## Endpoint Reference

| Client method                                  | Params                                                                             | Response type                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| `info.exchangeInfo()`                          | none                                                                               | `ExchangeInfoResponse`         |
| `info.markets()`                               | `{ include_instruments?: true }`                                                   | `MarketsResponse`              |
| `info.markets({ include_instruments: false })` | `{ include_instruments: false }`                                                   | `MarketsSlimResponse`          |
| `info.instruments(params)`                     | `{ currency, kind? }`                                                              | `InstrumentsResponse`          |
| `info.optionSummaries(params)`                 | `{ currency, kind?, expiry?, includeRfqProviderQuotes?, rfqProviderQuotesLimit? }` | `OptionSummariesResponse`      |
| `info.orderbook(params)`                       | `{ instrumentId, depth? }`                                                         | `OrderbookResponse`            |
| `info.portfolio(params)`                       | `{ wallet }`                                                                       | `PortfolioResponse`            |
| `info.profile(params)`                         | `{ wallet }`                                                                       | `ProfileResponse`              |
| `info.profileTrades(params)`                   | `{ wallet, limit?, offset?, from_ts_ms?, to_ts_ms?, symbol? }`                     | `ProfileTradesResponse`        |
| `info.profileRealizedPnl(params)`              | `{ wallet, from_ts_ms?, to_ts_ms? }`                                               | `RealizedPnlResponse`          |
| `info.orders(params)`                          | `{ wallet, limit?, offset?, status? }`                                             | `OrdersResponse`               |
| `info.orderStatus(params)`                     | `{ wallet, orderId }`                                                              | `OrderStatusResponse`          |
| `info.fills(params)`                           | `{ wallet, limit?, offset? }`                                                      | `FillsResponse`                |
| `info.trades(params)`                          | offset or filtered paging, or `{ after_trade_id, limit? }` cursor paging           | `TradesResponse`               |
| `info.trade(params)`                           | `{ tradeId }`                                                                      | `TradeResponse`                |
| `info.riskGrid(params)`                        | `{ wallet }`                                                                       | `RiskGridResponse`             |
| `info.referralBinding(params)`                 | `{ wallet }`                                                                       | `ReferralBinding`              |
| `info.referralCodeByOwner(params)`             | `{ wallet }`                                                                       | `ReferralCode \| null`         |
| `info.referralCode(params)`                    | `{ code }`                                                                         | `ReferralCode`                 |
| `info.referredWallets(params)`                 | `{ wallet, limit?, offset? }`                                                      | `ReferredWalletsResponse`      |
| `info.transfers(params)`                       | `{ wallet, transactionTypes?, assets?, statuses?, limit?, cursor? }`               | `TransfersResponse`            |
| `info.settlementPayouts(params)`               | `{ wallet, limit?, offset?, symbol?, ledgerApplied? }`                             | `SettlementPayoutsResponse`    |
| `info.authorizedAgents(params)`                | `{ wallet }`                                                                       | `AuthorizedAgentsResponse`     |
| `info.directiveStatus(params)`                 | `{ directiveId }`                                                                  | `DirectiveStatusResponse`      |
| `info.withdrawalHistory(params)`               | `{ wallet, limit? }`                                                               | `WithdrawalHistoryResponse`    |
| `info.rfqStatus(params)`                       | `{ rfqId }`                                                                        | `RfqStatusResponse`            |
| `info.historicalTheos(params)`                 | `{ instrumentName, interval, limit? }`                                             | `HistoricalTheosResponse`      |
| `info.historicalTheosBatch(params)`            | `{ instrumentNames, interval, limit? }`                                            | `HistoricalTheosBatchResponse` |
| `info.historicalPnl(params)`                   | `{ wallet, interval, limit?, includeAttribution? }`                                | `HistoricalPnlResponse`        |
| `info.liquidationStatus(params)`               | `{ wallet }`                                                                       | `LiquidationStatusResponse`    |
| `info.liquidationHistory(params)`              | `{ wallet, limit?, offset? }`                                                      | `LiquidationHistoryResponse`   |
| `info.liquidations(params)`                    | `{ cursor?, limit?, wallet?, status?, state?, marginMode?, liquidationMode? }`     | `LiquidationsResponse`         |

Hypercall API docs: https://docs.hypercall.xyz/docs/trading/over-api/

## Local Development

```bash
deno task check
deno task test
deno task example examples/read-markets.ts
deno task pack:npm
```

If Deno is not installed globally, prefix those commands with `npx -y`, for example `npx -y deno task test`.

The source layout is Deno-first:

- `deno.json` exports source `.ts` entrypoints.
- Source files import other source files with `.ts` extensions.
- Domain clients live under `src/api/<domain>/client.ts`.
- Low-level methods live under `src/api/<domain>/_methods/`.

The repository root intentionally does not keep a `package.json`. npm package metadata is generated into
`dist/package.json` by `deno task build:npm`, and `dist/` is only the local npm publish staging directory.
