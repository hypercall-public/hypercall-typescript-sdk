import * as v from "@valibot/valibot";

import { NonEmptyString, parse, PositiveInteger } from "../../_base.ts";
import type { Address, Decimal, Greeks, JsonRpcResponse } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request option summaries for a currency. */
export const OptionSummariesRequest = v.pipe(
  v.object({
    /** Underlying currency, such as BTC or US500. */
    currency: v.pipe(NonEmptyString, v.description("Underlying currency.")),
    /** Instrument kind. */
    kind: v.pipe(v.optional(NonEmptyString), v.description("Instrument kind.")),
    /** Optional expiry timestamp. */
    expiry: v.pipe(v.optional(PositiveInteger), v.description("Optional expiry timestamp.")),
    /** Include raw RFQ quote-provider indicative quotes. */
    includeRfqProviderQuotes: v.pipe(
      v.optional(v.boolean()),
      v.description("Include raw RFQ quote-provider indicative quotes."),
    ),
    /** Maximum RFQ provider quotes returned per instrument. */
    rfqProviderQuotesLimit: v.pipe(
      v.optional(PositiveInteger),
      v.description("Maximum RFQ provider quotes returned per instrument."),
    ),
  }),
  v.description("Request option summaries for a currency."),
);
export type OptionSummariesRequest = v.InferOutput<typeof OptionSummariesRequest>;

/** Request parameters for the {@linkcode optionSummaries} function. */
export type OptionSummariesParameters = v.InferInput<typeof OptionSummariesRequest>;

/** Raw quote-provider indicative quote behind an aggregate RFQ bid or ask. */
export type RfqProviderIndicativeQuote = {
  /** Quote-provider wallet address. */
  wallet: Address;
  /** Provider bid price. */
  bid_price: Decimal;
  /** Provider ask price. */
  ask_price: Decimal;
  /** Maximum size available at the bid. */
  max_bid_size: Decimal;
  /** Maximum size available at the ask. */
  max_ask_size: Decimal;
  /** Last update timestamp in milliseconds since epoch. */
  updated_at: number;
};

/** Public option summary with prices, interest, volume, and Greeks. */
export type OptionSummary = {
  /** Numeric instrument identifier. */
  instrument_id: number;
  /** Human-readable instrument symbol. */
  instrument_name: string;
  /** Option token contract address, if deployed. */
  option_token_address: Address | null;
  /** Expiration timestamp in milliseconds since epoch. */
  expiration_timestamp: number;
  /** Best bid price. */
  bid_price: number;
  /** Best ask price. */
  ask_price: number;
  /** Mark price. */
  mark_price: number;
  /** Theoretical option price, if available. */
  theoretical_price?: number | null;
  /** Mark implied volatility, if available. */
  mark_iv: number | null;
  /** Quote-derived ask implied volatility, if available. */
  ask_iv?: number | null;
  /** Quote-derived bid implied volatility, if available. */
  bid_iv?: number | null;
  /** Raw mark implied volatility, if returned by the API. */
  raw_mark_iv?: number | null;
  /** Estimated mark implied volatility, if returned by the API. */
  est_mark_iv?: number | null;
  /** Underlying index price. */
  underlying_price: number;
  /** Underlying index name. */
  underlying_index: string;
  /** Open interest in contracts. */
  open_interest: number;
  /** Rolling volume in contracts. */
  volume: number;
  /** Rolling volume in USD. */
  volume_usd: number;
  /** Rolling high price, if available. */
  high: number | null;
  /** Rolling low price, if available. */
  low: number | null;
  /** Last trade price, if available. */
  last: number | null;
  /** Rolling price change, if available. */
  price_change: number | null;
  /** Interest rate used for pricing. */
  interest_rate: number;
  /** Estimated delivery price. */
  estimated_delivery_price: number;
  /** Creation timestamp in milliseconds since epoch. */
  creation_timestamp: number;
  /** Base currency. */
  base_currency: string;
  /** Quote currency. */
  quote_currency: string;
  /** Mid price. */
  mid_price: number;
  /** Best bid size, if available. */
  best_bid_size?: number | null;
  /** Best ask size, if available. */
  best_ask_size?: number | null;
  /** Indicative bid price, if available. */
  indicative_bid_price?: number | null;
  /** Indicative ask price, if available. */
  indicative_ask_price?: number | null;
  /** Indicative bid size, if available. */
  indicative_bid_size?: number | null;
  /** Indicative ask size, if available. */
  indicative_ask_size?: number | null;
  /** Raw RFQ quote-provider indicative quotes, when requested. */
  rfq_provider_quotes?: RfqProviderIndicativeQuote[] | null;
  /** Greeks used for the summary, if available. */
  greeks?: Partial<Greeks> | null;
  /** Raw Greeks, if returned by the API. */
  raw_greeks?: Partial<Greeks> | null;
  /** Estimated Greeks, if returned by the API. */
  est_greeks?: Partial<Greeks> | null;
};

/** Option summaries response. */
export type OptionSummariesResponse = JsonRpcResponse<OptionSummary[]>;

/**
 * Request option summaries for a currency.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Option summaries response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { optionSummaries } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await optionSummaries({ transport }, { currency: "SPCX" });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function optionSummaries(
  config: InfoConfig,
  params: OptionSummariesParameters,
  signal?: AbortSignal,
): Promise<OptionSummariesResponse> {
  const request = parse(OptionSummariesRequest, params);
  const query = toQuery({
    currency: request.currency,
    kind: request.kind ?? "option",
    expiry: request.expiry,
    include_rfq_provider_quotes: request.includeRfqProviderQuotes,
    rfq_provider_quotes_limit: request.rfqProviderQuotesLimit,
  });

  return config.transport.request<OptionSummariesResponse>(`/options-summary?${query}`, {}, signal);
}
