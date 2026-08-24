import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Address, Decimal, PaginatedResponse } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request settlement payouts for a wallet. */
export const SettlementPayoutsRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Maximum rows to return. */
    limit: v.pipe(v.optional(PositiveInteger), v.description("Limit.")),
    /** Rows to skip. */
    offset: v.pipe(v.optional(NonNegativeInteger), v.description("Offset.")),
    /** Optional instrument symbol filter. */
    symbol: v.pipe(v.optional(NonEmptyString), v.description("Instrument symbol filter.")),
    /** Optional ledger application filter. */
    ledgerApplied: v.pipe(v.optional(v.boolean()), v.description("Ledger application filter.")),
  }),
  v.description("Request settlement payouts for a wallet."),
);
export type SettlementPayoutsRequest = v.InferOutput<typeof SettlementPayoutsRequest>;

/** Request parameters for the {@linkcode settlementPayouts} function. */
export type SettlementPayoutsParameters = v.InferInput<typeof SettlementPayoutsRequest>;

/** Settlement payout row for one expired position. */
export type SettlementPayout = {
  /** Unique settlement payout identifier. */
  id: number;
  /** Account wallet address. */
  wallet: Address;
  /** Instrument symbol. */
  symbol: string;
  /** Expiry timestamp in seconds since epoch. */
  expiry_ts: number;
  /** Settled position size in contracts. */
  position_size: Decimal;
  /** Settlement price in USD. */
  settlement_price: Decimal;
  /** Settlement value in USD. */
  settlement_value: Decimal;
  /** Average entry price used for settlement PnL, if available. */
  settlement_entry_price: Decimal | null;
  /** Position cost basis in USD, if available. */
  cost_basis: Decimal | null;
  /** Net settlement PnL in USD, if available. */
  net_pnl: Decimal | null;
  /** Whether the payout has been applied to the ledger. */
  ledger_applied: boolean;
  /** Whether the user has seen this payout notification. */
  is_seen: boolean;
  /** Creation timestamp in milliseconds since epoch, if available. */
  created_at: number | null;
};

/** Settlement payouts response. */
export type SettlementPayoutsResponse = PaginatedResponse<SettlementPayout> & {
  /** Human-readable error message, present on failure. */
  error?: string | null;
};

/**
 * Request settlement payouts for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Settlement payouts response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { settlementPayouts } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await settlementPayouts({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   limit: 25,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function settlementPayouts(
  config: InfoConfig,
  params: SettlementPayoutsParameters,
  signal?: AbortSignal,
): Promise<SettlementPayoutsResponse> {
  const request = parse(SettlementPayoutsRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    limit: request.limit,
    offset: request.offset,
    symbol: request.symbol,
    ledger_applied: request.ledgerApplied,
  });

  return config.transport.request<SettlementPayoutsResponse>(`/settlement-payouts?${query}`, {}, signal);
}
