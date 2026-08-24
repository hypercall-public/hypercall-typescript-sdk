import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Address, Decimal, Pagination } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

const LiquidationStateSchema = v.pipe(
  v.picklist(["healthy", "pre_liquidation", "in_liquidation", "liquidated"]),
  v.description("Liquidation state."),
);

const MarginModeSchema = v.pipe(
  v.picklist(["standard", "portfolio"]),
  v.description("Margin mode."),
);

const LiquidationModeSchema = v.pipe(
  v.picklist(["partial", "full"]),
  v.description("Liquidation mode."),
);

const LiquidationLimit = v.pipe(
  PositiveInteger,
  v.maxValue(100, "Expected a limit of 100 or less."),
);

/** Request liquidation status for a wallet. */
export const LiquidationStatusRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
  }),
  v.description("Request liquidation status for a wallet."),
);
export type LiquidationStatusRequest = v.InferOutput<typeof LiquidationStatusRequest>;

/** Request parameters for the {@linkcode liquidationStatus} function. */
export type LiquidationStatusParameters = v.InferInput<typeof LiquidationStatusRequest>;

/** Request liquidation history for a wallet. */
export const LiquidationHistoryRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Maximum rows to return. */
    limit: v.pipe(v.optional(LiquidationLimit), v.description("Limit.")),
    /** Rows to skip. */
    offset: v.pipe(v.optional(NonNegativeInteger), v.description("Offset.")),
  }),
  v.description("Request liquidation history for a wallet."),
);
export type LiquidationHistoryRequest = v.InferOutput<typeof LiquidationHistoryRequest>;

/** Request parameters for the {@linkcode liquidationHistory} function. */
export type LiquidationHistoryParameters = v.InferInput<typeof LiquidationHistoryRequest>;

/** Request public liquidation transitions. */
export const LiquidationsRequest = v.pipe(
  v.object({
    /** Opaque cursor returned by the previous page. */
    cursor: v.pipe(v.optional(NonEmptyString), v.description("Cursor.")),
    /** Maximum rows to return. */
    limit: v.pipe(v.optional(LiquidationLimit), v.description("Limit.")),
    /** Optional wallet filter. */
    wallet: v.pipe(v.optional(WalletAddress), v.description("Wallet address filter.")),
    /** Optional new state filter. */
    status: v.pipe(v.optional(LiquidationStateSchema), v.description("Status filter.")),
    /** Optional alias for status. */
    state: v.pipe(v.optional(LiquidationStateSchema), v.description("State filter.")),
    /** Optional margin mode filter. */
    marginMode: v.pipe(v.optional(MarginModeSchema), v.description("Margin mode filter.")),
    /** Optional liquidation mode filter. */
    liquidationMode: v.pipe(
      v.optional(LiquidationModeSchema),
      v.description("Liquidation mode filter."),
    ),
  }),
  v.description("Request public liquidation transitions."),
);
export type LiquidationsRequest = v.InferOutput<typeof LiquidationsRequest>;

/** Request parameters for the {@linkcode liquidations} function. */
export type LiquidationsParameters = v.InferInput<typeof LiquidationsRequest>;

/** Liquidation state values returned by read endpoints. */
export type LiquidationState = v.InferOutput<typeof LiquidationStateSchema>;

/** Account margin mode values returned by read endpoints. */
export type MarginMode = v.InferOutput<typeof MarginModeSchema>;

/** Liquidation mode values returned by read endpoints. */
export type LiquidationMode = v.InferOutput<typeof LiquidationModeSchema>;

/** Position included in standard-margin full liquidation auction terms. */
export type StandardMarginLiquidationPosition = {
  /** Instrument symbol. */
  symbol: string;
  /** Position quantity in contracts. */
  quantity: Decimal;
  /** Position entry price in USD. */
  entry_price: Decimal;
};

/** Partial liquidation metadata when partial liquidation is active. */
export type PartialLiquidationStatusData = {
  /** Timestamp when partial liquidation was entered. */
  entered_at: number;
  /** Target equity after partial liquidation. */
  target_equity: Decimal;
  /** Maintenance margin shortfall. */
  mm_shortfall: Decimal;
  /** Timestamp when partial liquidation escalates. */
  escalation_deadline: number;
  /** Timestamp of the last reprice, if any. */
  last_reprice_at: number | null;
  /** Active partial liquidation request IDs. */
  active_order_request_ids: string[];
  /** Active partial liquidation client IDs. */
  active_order_client_ids: string[];
  /** Liquidator bonus in basis points. */
  bonus_bps: number;
  /** Pending full liquidation auction ID, if any. */
  pending_full_auction_id: string | null;
  /** Pending full liquidation request ID, if any. */
  pending_full_request_id: string | null;
  /** Pending full liquidation transaction hash, if any. */
  pending_full_tx_hash: string | null;
  /** Pending full liquidation margin needed, if any. */
  pending_full_margin_needed: Decimal | null;
};

/** Full liquidation metadata when a full liquidation auction is active or resolved. */
export type FullLiquidationStatusData = {
  /** Auction ID. */
  auction_id: string | null;
  /** Request ID for the auction start directive. */
  request_id: string | null;
  /** Transaction hash for the auction start directive. */
  tx_hash: string | null;
  /** Timestamp when the auction started. */
  started_at: number | null;
  /** On-chain liquidation start timestamp. */
  chain_start_time: number | null;
  /** Margin needed for full liquidation. */
  margin_needed: Decimal | null;
  /** Request ID for a pending stop directive. */
  stop_request_id: string | null;
  /** Transaction hash for a pending stop directive. */
  stop_tx_hash: string | null;
  /** Timestamp when liquidation resolved. */
  liquidated_at: number | null;
  /** Winning liquidator wallet. */
  winner: Address | null;
  /** Insolvency bonus, if any. */
  bonus: Decimal | null;
  /** Resolution transaction hash, if any. */
  resolution_tx_hash: string | null;
  /** Current required bid in USDC for standard-margin full liquidation. */
  current_required_bid_usdc: Decimal | null;
  /** Current equity for standard-margin full liquidation terms. */
  current_equity: Decimal | null;
  /** Current maintenance margin requirement for standard-margin full liquidation terms. */
  current_mm_required: Decimal | null;
  /** Current maintenance margin for standard-margin full liquidation terms. */
  current_maintenance_margin: Decimal | null;
  /** Current position terms for standard-margin full liquidation. */
  current_positions: StandardMarginLiquidationPosition[] | null;
  /** Current portfolio hash expected by settlement. */
  current_portfolio_hash: string | null;
  /** Current auction terms hash expected by settlement. */
  current_auction_terms_hash: string | null;
  /** Current auction version expected by settlement. */
  current_auction_version: number | null;
  /** Valuation timestamp for current standard-margin full liquidation terms. */
  current_valuation_timestamp_ms: number | null;
};

/** Current liquidation status for one wallet. */
export type LiquidationStatusData = {
  /** Account wallet address. */
  wallet: Address;
  /** Current liquidation state. */
  state: LiquidationState;
  /** Current liquidation mode when active. */
  liquidation_mode: LiquidationMode | null;
  /** Current margin mode. */
  margin_mode: MarginMode;
  /** Current equity in USD. */
  equity: Decimal;
  /** Maintenance margin required in USD. */
  mm_required: Decimal;
  /** Maintenance margin in USD. */
  maintenance_margin: Decimal;
  /** Positive maintenance shortfall in USD. */
  shortfall: Decimal;
  /** Partial liquidation metadata, if active. */
  partial_liquidation: PartialLiquidationStatusData | null;
  /** Full liquidation metadata, if active or resolved. */
  full_liquidation: FullLiquidationStatusData | null;
};

/** Liquidation status response. */
export type LiquidationStatusResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Current liquidation status, if present. */
  data: LiquidationStatusData | null;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/** One liquidation transition. */
export type LiquidationHistoryEntry = {
  /** History entry ID. */
  id: number;
  /** Account wallet address. */
  wallet: Address;
  /** Previous liquidation state. */
  previous_state: LiquidationState;
  /** New liquidation state. */
  new_state: LiquidationState;
  /** Liquidation mode, if applicable. */
  liquidation_mode: LiquidationMode | null;
  /** Equity at the transition. */
  equity: Decimal;
  /** Maintenance margin required at the transition. */
  mm_required: Decimal;
  /** Maintenance margin at the transition. */
  maintenance_margin: Decimal;
  /** Shortfall at the transition. */
  shortfall: Decimal;
  /** Auction ID, if applicable. */
  auction_id: string | null;
  /** Request ID for the transition. */
  request_id: string | null;
  /** Transaction hash for the transition. */
  tx_hash: string | null;
  /** Margin needed for full liquidation, if applicable. */
  margin_needed: Decimal | null;
  /** Winning liquidator or manager, if resolved. */
  winner_address: Address | null;
  /** Bonus credited on resolution, if any. */
  bonus: Decimal | null;
  /** Serialized status snapshot for debugging. */
  details: unknown;
  /** Transition timestamp in milliseconds since epoch. */
  timestamp: number;
};

/** Liquidation history response. */
export type LiquidationHistoryResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Returned history entries. */
  data: LiquidationHistoryEntry[];
  /** Pagination metadata. */
  pagination: Pagination;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/** Cursor metadata for public liquidation transitions. */
export type CursorPage = {
  /** Page size used by the request. */
  limit: number;
  /** Opaque cursor for the next page, if another page exists. */
  next_cursor: string | null;
  /** Whether another page is available. */
  has_more: boolean;
};

/** Public liquidation transitions response. */
export type LiquidationsResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Liquidation transitions ordered newest first. */
  data: LiquidationHistoryEntry[];
  /** Cursor pagination metadata. */
  page: CursorPage;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/**
 * Request liquidation status for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Liquidation status response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { liquidationStatus } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await liquidationStatus({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function liquidationStatus(
  config: InfoConfig,
  params: LiquidationStatusParameters,
  signal?: AbortSignal,
): Promise<LiquidationStatusResponse> {
  const request = parse(LiquidationStatusRequest, params);
  const query = toQuery({ wallet: request.wallet.toLowerCase() });

  return config.transport.request<LiquidationStatusResponse>(`/liquidation/status?${query}`, {}, signal);
}

/**
 * Request liquidation history for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Liquidation history response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { liquidationHistory } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await liquidationHistory({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   limit: 20,
 *   offset: 0,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function liquidationHistory(
  config: InfoConfig,
  params: LiquidationHistoryParameters,
  signal?: AbortSignal,
): Promise<LiquidationHistoryResponse> {
  const request = parse(LiquidationHistoryRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    limit: request.limit,
    offset: request.offset,
  });

  return config.transport.request<LiquidationHistoryResponse>(`/liquidation/history?${query}`, {}, signal);
}

/**
 * Request public liquidation transitions.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Public liquidation transitions response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { liquidations } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await liquidations({ transport }, {
 *   limit: 50,
 *   status: "in_liquidation",
 *   marginMode: "standard",
 *   liquidationMode: "full",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function liquidations(
  config: InfoConfig,
  params: LiquidationsParameters = {},
  signal?: AbortSignal,
): Promise<LiquidationsResponse> {
  const request = parse(LiquidationsRequest, params);
  const query = toQuery({
    cursor: request.cursor,
    limit: request.limit,
    wallet: request.wallet?.toLowerCase(),
    status: request.status,
    state: request.state,
    margin_mode: request.marginMode,
    liquidation_mode: request.liquidationMode,
  });
  const suffix = query ? `?${query}` : "";

  return config.transport.request<LiquidationsResponse>(`/liquidations${suffix}`, {}, signal);
}
