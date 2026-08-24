import * as v from "@valibot/valibot";

import { parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Address, Decimal } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

const HistoricalPnlIntervalSchema = v.pipe(
  v.picklist(["5m", "1h", "1d"]),
  v.description("Historical PnL interval."),
);

const HistoricalPnlLimit = v.pipe(
  PositiveInteger,
  v.maxValue(100, "Expected a limit of 100 or less."),
);

/** Request historical account equity and PnL snapshots. */
export const HistoricalPnlRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Interval bucket size. */
    interval: HistoricalPnlIntervalSchema,
    /** Maximum number of periods to return. Defaults to 100 on the API. */
    limit: v.pipe(v.optional(HistoricalPnlLimit), v.description("Limit.")),
    /** Whether to include per-symbol attribution on each point. */
    includeAttribution: v.pipe(
      v.optional(v.boolean()),
      v.description("Include per-symbol attribution."),
    ),
  }),
  v.description("Request historical account equity and PnL snapshots."),
);
export type HistoricalPnlRequest = v.InferOutput<typeof HistoricalPnlRequest>;

/** Request parameters for the {@linkcode historicalPnl} function. */
export type HistoricalPnlParameters = v.InferInput<typeof HistoricalPnlRequest>;

/** Supported historical PnL intervals. */
export type HistoricalPnlInterval = v.InferOutput<typeof HistoricalPnlIntervalSchema>;

/** Per-symbol attribution: [position, entry_price, realized, unrealized, total]. */
export type SymbolAttribution = [number, number, number, number, number];

/** One historical account equity and PnL point. */
export type HistoricalPnlPoint = {
  /** Interval bucket start timestamp in milliseconds since epoch. */
  timestamp: number;
  /** Total account equity at the bucket timestamp. */
  equity: Decimal;
  /** Per-symbol PnL attribution keyed by instrument symbol. */
  attribution?: Record<string, SymbolAttribution> | null;
  /** Cumulative net deposits at the bucket timestamp. */
  net_deposits?: Decimal | null;
};

/** Historical account equity and PnL data. */
export type HistoricalPnlData = {
  /** Account wallet address. */
  wallet_address: Address;
  /** Historical interval identifier. */
  interval: HistoricalPnlInterval;
  /** Returned points in ascending timestamp order. */
  points: HistoricalPnlPoint[];
};

/** Historical account equity and PnL response. */
export type HistoricalPnlResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Historical PnL payload, present on success. */
  data: HistoricalPnlData | null;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/**
 * Request historical account equity and PnL snapshots.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Historical account equity and PnL response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { historicalPnl } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await historicalPnl({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   interval: "1h",
 *   limit: 24,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function historicalPnl(
  config: InfoConfig,
  params: HistoricalPnlParameters,
  signal?: AbortSignal,
): Promise<HistoricalPnlResponse> {
  const request = parse(HistoricalPnlRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    interval: request.interval,
    limit: request.limit,
    include_attribution: request.includeAttribution,
  });

  return config.transport.request<HistoricalPnlResponse>(`/historical-pnl?${query}`, {}, signal);
}
