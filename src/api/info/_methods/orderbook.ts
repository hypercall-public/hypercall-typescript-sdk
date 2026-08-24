import * as v from "@valibot/valibot";

import { NonEmptyString, parse, PositiveInteger } from "../../_base.ts";
import type { Address, Greeks, JsonRpcResponse } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request orderbook for an instrument. */
export const OrderbookRequest = v.pipe(
  v.object({
    /** Instrument id. */
    instrumentId: v.pipe(
      v.union([NonEmptyString, PositiveInteger]),
      v.description("Instrument id."),
    ),
    /** Orderbook depth. */
    depth: v.pipe(v.optional(PositiveInteger), v.description("Book depth.")),
  }),
  v.description("Request orderbook for an instrument."),
);
export type OrderbookRequest = v.InferOutput<typeof OrderbookRequest>;

/** Request parameters for the {@linkcode orderbook} function. */
export type OrderbookParameters = v.InferInput<typeof OrderbookRequest>;

/** Orderbook statistics. */
export type OrderBookStats = {
  /** Rolling high price, if available. */
  high: number | null;
  /** Rolling low price, if available. */
  low: number | null;
  /** Rolling price change, if available. */
  price_change: number | null;
  /** Rolling volume in contracts. */
  volume: number;
  /** Rolling volume in USD. */
  volume_usd: number;
};

/** Orderbook snapshot for one instrument. */
export type OrderBook = {
  /** Snapshot timestamp in milliseconds since epoch. */
  timestamp: number;
  /** Market state. */
  state: string;
  /** Orderbook statistics. */
  stats: OrderBookStats;
  /** Option Greeks, if available. */
  greeks?: Greeks | null;
  /** Change ID for incremental updates. */
  change_id: number;
  /** Index price. */
  index_price: number;
  /** Human-readable instrument symbol. */
  instrument_name: string;
  /** Option token contract address, if deployed. */
  option_token_address?: Address | null;
  /** Bid levels as [price, size]. */
  bids: [number, number][];
  /** Ask levels as [price, size]. */
  asks: [number, number][];
  /** Last trade price, if available. */
  last_price: number | null;
  /** Settlement price. */
  settlement_price: number;
  /** Minimum allowed price. */
  min_price: number;
  /** Maximum allowed price. */
  max_price: number;
  /** Open interest in contracts. */
  open_interest: number;
  /** Mark price. */
  mark_price: number;
  /** Theoretical option price, if available. */
  theoretical_price?: number | null;
  /** Mark implied volatility, if available. */
  mark_iv?: number | null;
  /** Quote-derived ask implied volatility, if available. */
  ask_iv?: number | null;
  /** Quote-derived bid implied volatility, if available. */
  bid_iv?: number | null;
  /** Best bid price. */
  best_bid_price: number;
  /** Best ask price. */
  best_ask_price: number;
  /** Underlying index price. */
  underlying_price: number;
  /** Underlying index name. */
  underlying_index: string;
  /** Interest rate used for pricing. */
  interest_rate: number;
  /** Estimated delivery price. */
  estimated_delivery_price: number;
  /** Best ask size in contracts. */
  best_ask_amount: number;
  /** Best bid size in contracts. */
  best_bid_amount: number;
};

/** Orderbook response. */
export type OrderbookResponse = JsonRpcResponse<OrderBook>;

/**
 * Request orderbook for an instrument.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Orderbook response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { orderbook } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await orderbook({ transport }, {
 *   instrumentId: 1,
 *   depth: 15,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function orderbook(
  config: InfoConfig,
  params: OrderbookParameters,
  signal?: AbortSignal,
): Promise<OrderbookResponse> {
  const request = parse(OrderbookRequest, params);
  const query = toQuery({
    instrument_id: String(request.instrumentId),
    depth: request.depth ?? 15,
  });

  return config.transport.request<OrderbookResponse>(`/orderbook?${query}`, {}, signal);
}
