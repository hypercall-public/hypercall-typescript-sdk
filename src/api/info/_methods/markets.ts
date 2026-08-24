import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { Address, Decimal, ListResponse } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request listed markets. */
export const MarketsRequest = /* @__PURE__ */ (() => {
  return v.object({
    /** Include instrument details in each market. */
    include_instruments: v.optional(v.boolean()),
  });
})();
export type MarketsRequest = v.InferOutput<typeof MarketsRequest>;

/** Request parameters for the {@linkcode markets} function. */
export type MarketsParameters = {
  /** Include instrument details in each market. */
  include_instruments?: boolean;
};

/** Request parameters that return slim markets without instrument details. */
export type MarketsSlimParameters = MarketsParameters & {
  /** Disable instrument details in each market. */
  include_instruments: false;
};

/** Lifecycle state of a listed instrument. */
export type InstrumentStatus = "ACTIVE" | "EXPIRED_PENDING_PRICE" | "SETTLED";

/** Public market instrument metadata. */
export type MarketInstrument = {
  /** Numeric instrument identifier. */
  instrument_id: number;
  /** Human-readable instrument symbol. */
  id: string;
  /** Underlying asset. */
  underlying: string;
  /** Strike price in USD. */
  strike: Decimal;
  /** Expiry timestamp in seconds since epoch. */
  expiry: number;
  /** Option type. */
  option_type: "call" | "put";
  /** On-chain option token contract address, if deployed. */
  option_token_address: Address | null;
  /** Mark implied volatility as a decimal. */
  mark_iv: Decimal | null;
  /** Rolling 24-hour traded volume in contracts. */
  volume_24h: Decimal;
  /** Total open interest in contracts. */
  open_interest: Decimal;
  /** Last refresh timestamp. */
  updated_at: string;
  /** Current lifecycle state. */
  status: InstrumentStatus;
  /** Trading mode flags for this instrument. */
  trading_mode: string;
};

/** Full market summary for one underlying and expiry. */
export type Market = {
  /** Underlying asset. */
  underlying: string;
  /** Expiry timestamp in seconds since epoch. */
  expiry: number;
  /** Current spot/index price of the underlying in USD. */
  index_price: Decimal;
  /** At-the-money implied volatility as a decimal, if available. */
  atm_vol: Decimal | null;
  /** Instruments listed under this underlying/expiry pair. */
  instruments: MarketInstrument[];
  /** Aggregate 24-hour traded volume across all instruments. */
  total_volume_24h: Decimal;
  /** Aggregate open interest across all instruments. */
  total_open_interest: Decimal;
  /** Previous day's closing index price in USD, if available. */
  prev_day_price?: Decimal | null;
};

/** Slim market summary without instrument details. */
export type MarketSlim = Omit<Market, "instruments" | "prev_day_price"> & {
  /** Previous day's closing index price in USD, if available. */
  prev_day_px?: Decimal | null;
};

/** Listed markets response with instruments included. */
export type MarketsResponse = ListResponse<Market>;

/** Listed markets response without instrument details. */
export type MarketsSlimResponse = ListResponse<MarketSlim>;

/**
 * Request listed markets.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Listed markets response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { markets } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await markets({ transport }, { include_instruments: false });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function markets(
  config: InfoConfig,
  params: MarketsSlimParameters,
  signal?: AbortSignal,
): Promise<MarketsSlimResponse>;
export function markets(
  config: InfoConfig,
  params?: MarketsParameters,
  signal?: AbortSignal,
): Promise<MarketsResponse>;
export function markets(
  config: InfoConfig,
  signal?: AbortSignal,
): Promise<MarketsResponse>;
export function markets(
  config: InfoConfig,
  paramsOrSignal?: MarketsParameters | AbortSignal,
  maybeSignal?: AbortSignal,
): Promise<MarketsResponse | MarketsSlimResponse> {
  const params = paramsOrSignal instanceof AbortSignal ? {} : (paramsOrSignal ?? {});
  const signal = paramsOrSignal instanceof AbortSignal ? paramsOrSignal : maybeSignal;
  const request = parse(MarketsRequest, params);
  const query = toQuery({ include_instruments: request.include_instruments });

  return config.transport.request<MarketsResponse | MarketsSlimResponse>(
    query ? `/markets?${query}` : "/markets",
    {},
    signal,
  );
}
