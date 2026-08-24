import * as v from "@valibot/valibot";

import { NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Address, Decimal, InstrumentType, PaginatedResponse, Side } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request fills for a wallet. */
export const FillsRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Maximum rows to return. */
    limit: v.pipe(v.optional(PositiveInteger), v.description("Limit.")),
    /** Rows to skip. */
    offset: v.pipe(v.optional(NonNegativeInteger), v.description("Offset.")),
  }),
  v.description("Request fills for a wallet."),
);
export type FillsRequest = v.InferOutput<typeof FillsRequest>;

/** Request parameters for the {@linkcode fills} function. */
export type FillsParameters = v.InferInput<typeof FillsRequest>;

/** One fill for a specific wallet. */
export type Fill = {
  /** Unique fill identifier. */
  fill_id: number;
  /** Parent trade identifier that produced this fill. */
  trade_id: number;
  /** Wallet that received this fill. */
  wallet_address: Address;
  /** Instrument symbol that was filled. */
  symbol: string;
  /** Execution price in USD. */
  price: Decimal;
  /** Fill size in contracts. */
  size: Decimal;
  /** Fee charged for this fill in USD. */
  fee: Decimal;
  /** Wallet-specific fill side. */
  side: Side;
  /** Whether this fill was on the taker side. */
  is_taker: boolean;
  /** Fill timestamp in milliseconds since epoch. */
  timestamp: number;
  /** Timestamp when the fill was persisted. */
  created_at: string;
  /** Builder/referral code wallet, if a builder code was used. */
  builder_code_address: Address | null;
  /** Fee rebate to the builder code wallet in USD. */
  builder_code_fee: Decimal | null;
  /** Realized PnL from this fill in USD, if a position was reduced. */
  realized_pnl: Decimal | null;
  /** Link to the on-chain transaction, if settled. */
  explorer_url: string | null;
  /** Instrument family that produced this fill. */
  instrument_type: InstrumentType;
};

/** Fills response. */
export type FillsResponse = PaginatedResponse<Fill>;

/**
 * Request fills for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Fills response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercall/sdk";
 * import { fills } from "@hypercall/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await fills({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   limit: 50,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function fills(
  config: InfoConfig,
  params: FillsParameters,
  signal?: AbortSignal,
): Promise<FillsResponse> {
  const request = parse(FillsRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    limit: request.limit,
    offset: request.offset,
  });

  return config.transport.request<FillsResponse>(`/fills?${query}`, {}, signal);
}
