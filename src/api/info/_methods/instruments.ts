import * as v from "@valibot/valibot";

import { NonEmptyString, parse } from "../../_base.ts";
import type { Address, JsonRpcResponse, TickSizeStep } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request instruments for a currency. */
export const InstrumentsRequest = v.pipe(
  v.object({
    /** Underlying currency, such as BTC or US500. */
    currency: v.pipe(NonEmptyString, v.description("Underlying currency.")),
    /** Instrument kind. */
    kind: v.pipe(v.optional(NonEmptyString), v.description("Instrument kind.")),
  }),
  v.description("Request instruments for a currency."),
);
export type InstrumentsRequest = v.InferOutput<typeof InstrumentsRequest>;

/** Request parameters for the {@linkcode instruments} function. */
export type InstrumentsParameters = v.InferInput<typeof InstrumentsRequest>;

/** Public instrument metadata from the Deribit-compatible instruments endpoint. */
export type Instrument = {
  /** Price index name. */
  price_index: string;
  /** Whether RFQ is enabled. */
  rfq: boolean;
  /** Whether the orderbook is enabled. */
  orderbook: boolean;
  /** Instrument kind. */
  kind: "option" | string;
  /** Human-readable instrument symbol. */
  instrument_name: string;
  /** Option token contract address, if deployed. */
  option_token_address: Address | null;
  /** Maker commission rate. */
  maker_commission: number;
  /** Taker commission rate. */
  taker_commission: number;
  /** Instrument type. */
  instrument_type: string;
  /** Expiration timestamp in milliseconds since epoch. */
  expiration_timestamp: number;
  /** Creation timestamp in milliseconds since epoch. */
  creation_timestamp: number;
  /** Whether the instrument is active. */
  is_active: boolean;
  /** Option type. */
  option_type: "call" | "put" | string;
  /** Contract size. */
  contract_size: number;
  /** Base tick size. */
  tick_size: number;
  /** Strike price. */
  strike: number;
  /** Numeric instrument identifier. */
  instrument_id: number;
  /** Settlement period. */
  settlement_period: string;
  /** Minimum trade amount. */
  min_trade_amount: number;
  /** Block trade commission. */
  block_trade_commission: number;
  /** Block trade minimum amount. */
  block_trade_min_trade_amount: number;
  /** Block trade tick size. */
  block_trade_tick_size: number;
  /** Settlement currency. */
  settlement_currency: string;
  /** Base currency. */
  base_currency: string;
  /** Counter currency. */
  counter_currency: string;
  /** Quote currency. */
  quote_currency: string;
  /** Stepped tick-size rules. */
  tick_size_steps: TickSizeStep[];
};

/** Instruments response. */
export type InstrumentsResponse = JsonRpcResponse<Instrument[]>;

/**
 * Request instruments for a currency.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Instruments response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { instruments } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await instruments({ transport }, { currency: "SPCX" });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function instruments(
  config: InfoConfig,
  params: InstrumentsParameters,
  signal?: AbortSignal,
): Promise<InstrumentsResponse> {
  const request = parse(InstrumentsRequest, params);
  const query = toQuery({
    currency: request.currency,
    kind: request.kind ?? "option",
  });

  return config.transport.request<InstrumentsResponse>(`/instruments?${query}`, {}, signal);
}
