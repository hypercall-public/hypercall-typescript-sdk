import * as v from "@valibot/valibot";

import { parse, WalletAddress } from "../../_base.ts";
import type { ApiResponse, Decimal } from "./_base/_schemas.ts";
import type { InfoConfig } from "./_base/mod.ts";
import type { PerpRejectionReasonCode } from "../../exchange/_methods/_base/teePerp.ts";

// -------------------- Schemas --------------------

const PositiveDecimal = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^(?:\d+(?:\.\d*)?|\.\d+)$/, "Expected an unsigned decimal string"),
  v.check((value) => /[1-9]/.test(value), "Expected a positive decimal"),
);

const Asset = v.pipe(v.number(), v.integer("Expected an integer asset"), v.minValue(0), v.maxValue(4_294_967_295));

/** Native time in force, as the preview names it. */
export const PerpPreviewTif = v.picklist(["Gtc", "Ioc", "Alo"]);
export type PerpPreviewTif = v.InferOutput<typeof PerpPreviewTif>;

/** Exactly one of `limit` or `trigger`. Prices are USDC decimals, not 1e8 integers. */
export const PerpPreviewOrderType = v.union([
  v.strictObject({ limit: v.object({ tif: PerpPreviewTif }) }),
  v.strictObject({
    trigger: v.object({ triggerPx: PositiveDecimal, isMarket: v.boolean(), tpsl: v.picklist(["tp", "sl"]) }),
  }),
]);
export type PerpPreviewOrderType = v.InferOutput<typeof PerpPreviewOrderType>;

const OrderFields = {
  /** Hyperliquid perp asset index. */
  asset: Asset,
  isBuy: v.boolean(),
  /** Limit price in USDC (the signed execution bound for a market order or market trigger). */
  limitPx: PositiveDecimal,
  /** Size in coins. */
  sz: PositiveDecimal,
  reduceOnly: v.optional(v.boolean(), false),
  orderType: PerpPreviewOrderType,
};

/** One native order in a preview batch. */
export const PerpPreviewOrder = v.object(OrderFields);
export type PerpPreviewOrder = v.InferOutput<typeof PerpPreviewOrder>;

/** A leverage setting the preview should assume instead of the current one. */
export const PerpPreviewLeverageSetting = v.object({
  isCross: v.boolean(),
  value: v.pipe(v.number(), v.integer(), v.minValue(1, "Expected leverage of at least 1")),
});

/** The action to preview, tagged by `kind`. TWAP is not offered: it has no submit route. */
export const PerpPreviewAction = v.variant("kind", [
  v.object({ kind: v.literal("order"), ...OrderFields, leverage: v.optional(PerpPreviewLeverageSetting) }),
  v.object({
    kind: v.literal("order_batch"),
    grouping: v.picklist(["na", "normalTpsl", "positionTpsl"]),
    orders: v.pipe(v.array(PerpPreviewOrder), v.minLength(1), v.maxLength(100, "Expected at most 100 orders")),
    leverage: v.optional(PerpPreviewLeverageSetting),
  }),
  v.object({
    kind: v.literal("leverage"),
    asset: Asset,
    isCross: v.boolean(),
    leverage: v.pipe(v.number(), v.integer(), v.minValue(1, "Expected leverage of at least 1")),
  }),
]);
export type PerpPreviewAction = v.InferOutput<typeof PerpPreviewAction>;

/** Request a read-only preview of a TEE perp action. No signature is needed. */
export const TeePerpPreviewRequest = v.pipe(
  v.object({
    /** Trading account (or its manager wallet, resolved like other reads). */
    account: v.pipe(WalletAddress, v.description("Account or manager wallet.")),
    action: PerpPreviewAction,
  }),
  v.description("Preview a TEE perp action."),
);
export type TeePerpPreviewRequest = v.InferOutput<typeof TeePerpPreviewRequest>;

/** Parameters for the {@linkcode teePerpPreview} function. */
export type TeePerpPreviewParameters = v.InferInput<typeof TeePerpPreviewRequest>;

// -------------------- Response Types --------------------

/** Portfolio margin before and after the action, as admission charges it. */
export type PerpPreviewMargin = {
  equity: Decimal;
  initialRequiredBefore: Decimal;
  initialRequiredAfter: Decimal;
  initialAvailableAfter: Decimal;
  maintenanceRequiredAfter: Decimal;
  /** Initial margin after minus equity when positive, otherwise null. */
  shortfall: Decimal | null;
};

/** The liquidation reached first as the market's price moves. */
export type PerpLiquidationBinding = "hyperliquid" | "portfolio_margin";

/** Survival of one HyperCore collateral compartment (snake_case on the wire). */
export type VenueCompartmentRisk = {
  underlyings: string[];
  hedge_survives: boolean;
  liquidated_in?: "venue" | "valuation";
  collateral_loss: Decimal;
};

/** Venue-liquidation-aware requirement. While `enforced` is false it is reported, not used. */
export type VenueLiquidationRisk = {
  enforced: boolean;
  position_initial_margin?: Decimal;
  position_maintenance_margin?: Decimal;
  scanning_risk?: Decimal;
  compartments?: VenueCompartmentRisk[];
  unavailable_reason?: string;
};

/** Preview result. Margin and liquidation figures come only from the server. */
export type PerpPreview = {
  decision: "ok" | "rejected";
  reasonCode: PerpRejectionReasonCode | null;
  /** Exactly the text the real submit would return. */
  reason: string | null;
  /** Null when the action never reaches margin evaluation. */
  margin: PerpPreviewMargin | null;
  /** Current projected liquidation price of the market (the stricter of Hyperliquid and PM). */
  liquidationPxBefore: Decimal | null;
  /** The same price after the action. */
  liquidationPxAfter: Decimal | null;
  /** Which liquidation binds `liquidationPxAfter`. */
  liquidationBinding: PerpLiquidationBinding | null;
  venueLiquidation: VenueLiquidationRisk | null;
  /** Largest same-side size that still passes admission (plain limit orders). */
  maxSize: { sz: Decimal; notional: Decimal } | null;
  notes: string[];
};

/** Response envelope for {@linkcode teePerpPreview}. */
export type TeePerpPreviewResponse = ApiResponse<PerpPreview>;

/**
 * Preview whether portfolio-margin admission accepts a TEE perp action, and why not. The server
 * runs the same admission as submission on an immutable engine snapshot, without journaling,
 * nonces, reservations, or TEE calls.
 *
 * @param config General configuration for Info API requests.
 * @param params Preview request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Preview response envelope.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { teePerpPreview } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpPreview({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   action: {
 *     kind: "order",
 *     asset: 0,
 *     isBuy: true,
 *     limitPx: "100000",
 *     sz: "0.01",
 *     orderType: { limit: { tif: "Gtc" } },
 *   },
 * });
 * ```
 */
export function teePerpPreview(
  config: InfoConfig,
  params: TeePerpPreviewParameters,
  signal?: AbortSignal,
): Promise<TeePerpPreviewResponse> {
  const request = parse(TeePerpPreviewRequest, params);

  return config.transport.request<TeePerpPreviewResponse>(
    "/v1/tee-perp/preview",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    },
    signal,
  );
}

/** Whether a null liquidation price means "could not be computed" rather than "never reached". */
export function perpPreviewLiquidationUnavailable(preview: Pick<PerpPreview, "notes">): boolean {
  return preview.notes.some((note) => /^Liquidation price (input )?unavailable/.test(note));
}
