import * as v from "@valibot/valibot";

import { parse, WalletAddress } from "../../_base.ts";
import type { Address, ApiResponse, Decimal } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request portfolio for a wallet. */
export const PortfolioRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
  }),
  v.description("Request portfolio for a wallet."),
);
export type PortfolioRequest = v.InferOutput<typeof PortfolioRequest>;

/** Request parameters for the {@linkcode portfolio} function. */
export type PortfolioParameters = v.InferInput<typeof PortfolioRequest>;

/** SPAN-based portfolio margin breakdown for an account. */
export type SpanMarginSummary = {
  /** Total account equity in USD. */
  equity: Decimal;
  /** Initial margin required for existing positions in USD. */
  initial_margin_required: Decimal;
  /** Maintenance margin required for existing positions in USD. */
  maintenance_margin_required: Decimal;
  /** Initial margin reserved for open orders in USD. */
  open_orders_initial_margin: Decimal;
  /** Options-specific margin requirement in USD. */
  option_margin_required: Decimal;
  /** SPAN scanning risk in USD. */
  scanning_risk: Decimal;
  /** Minimum option margin floor in USD. */
  option_floor: Decimal;
  /** Gamma/curvature overlay charge in USD. */
  gamma_overlay: Decimal;
  /** Margin held on HyperCore for perp positions in USD. */
  hypercore_margin_required: Decimal;
};

/** Unified margin summary for standard and portfolio margin modes. */
export type MarginSummary = {
  /** Margin mode. */
  mode: string;
  /** Total account equity in USD. */
  equity: Decimal;
  /** Initial margin required from positions in USD. */
  position_im: Decimal;
  /** Initial margin from open orders in USD. */
  open_orders_im: Decimal;
  /** Excess initial margin in USD. */
  initial_margin: Decimal;
  /** Excess maintenance margin in USD. */
  maintenance_margin: Decimal;
  /** Standard mode USDC premium reserved for open buy orders. */
  open_orders_premium_reserved?: Decimal | null;
};

/** Position enriched with derived risk metrics. */
export type PortfolioPosition = {
  /** Account wallet address. */
  wallet_address: Address;
  /** Instrument symbol. */
  symbol: string;
  /** Position size in contracts. */
  amount: Decimal;
  /** Volume-weighted average entry price in USD. */
  entry_price: Decimal;
  /** Margin currently locked against this position in USD. */
  margin_posted: Decimal;
  /** Cumulative realized PnL in USD. */
  realized_pnl: Decimal;
  /** Mark-to-market unrealized PnL in USD. */
  unrealized_pnl: Decimal;
  /** Timestamp of the last position update. */
  updated_at: string;
  /** Dollar notional value of the position. */
  notional_value: Decimal;
  /** Maintenance margin requirement in USD. */
  maintenance_margin: Decimal;
  /** Estimated liquidation price in USD. */
  liquidation_price: Decimal;
  /** Margin utilization ratio. */
  margin_ratio: Decimal;
};

/** Full portfolio snapshot for one account. */
export type Portfolio = {
  /** Account wallet address. */
  wallet_address: Address;
  /** All open positions with enriched risk metrics. */
  positions: PortfolioPosition[];
  /** Total margin currently in use in USD. */
  total_margin_used: Decimal;
  /** Free collateral available for new trades in USD. */
  available_balance: Decimal;
  /** HyperCore Account.sol USDC eligible for a direct portfolio-margin withdrawal. */
  withdrawable_usdc?: Decimal | null;
  /** Source timestamp of the authoritative portfolio snapshot. */
  portfolio_snapshot_timestamp_ms: number | null;
  /** SPAN margin breakdown, present when computed. */
  span_margin?: SpanMarginSummary;
  /** Margin mode for this account. */
  margin_mode: "standard" | "portfolio" | string;
  /** Unified margin summary, present when computed. */
  margin_summary?: MarginSummary;
};

/** Portfolio response. */
export type PortfolioResponse = ApiResponse<Portfolio>;

/**
 * Request portfolio for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Portfolio response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercall/sdk";
 * import { portfolio } from "@hypercall/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await portfolio({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function portfolio(
  config: InfoConfig,
  params: PortfolioParameters,
  signal?: AbortSignal,
): Promise<PortfolioResponse> {
  const request = parse(PortfolioRequest, params);
  const query = toQuery({ wallet: request.wallet.toLowerCase() });

  return config.transport.request<PortfolioResponse>(`/portfolio?${query}`, {}, signal);
}
