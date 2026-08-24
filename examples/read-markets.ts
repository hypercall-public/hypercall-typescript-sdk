import {
  HttpTransport,
  InfoClient,
  type Instrument,
  type MarketSlim,
  type OptionSummary,
  type OrderBook,
} from "@hypercallxyz/sdk";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const markets = await info.markets({ include_instruments: false });
const firstMarket: MarketSlim | undefined = markets.data[0];
const currency = firstMarket?.underlying ?? "SPCX";

const instruments = await info.instruments({ currency });
const firstInstrument: Instrument | undefined = instruments.result?.[0];

const summaries = await info.optionSummaries({
  currency,
  includeRfqProviderQuotes: true,
  rfqProviderQuotesLimit: 5,
});
const firstSummary: OptionSummary | undefined = summaries.result?.[0];

const book = firstInstrument
  ? await info.orderbook({ instrumentId: firstInstrument.instrument_id, depth: 15 })
  : undefined;
const orderbook: OrderBook | undefined = book?.result;

console.log({
  currency,
  firstMarket: firstMarket?.underlying,
  firstInstrument: firstInstrument?.instrument_name,
  firstSummary: firstSummary?.instrument_name,
  rfqProviderQuotes: firstSummary?.rfq_provider_quotes?.length ?? 0,
  bestBid: orderbook?.best_bid_price,
  bestAsk: orderbook?.best_ask_price,
});
