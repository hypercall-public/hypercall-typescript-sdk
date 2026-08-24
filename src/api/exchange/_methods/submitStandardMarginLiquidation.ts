import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Position included in a standard-margin liquidation bid. */
export const StandardMarginLiquidationPositionRequest = v.pipe(
  v.object({
    /** Instrument symbol. */
    symbol: v.pipe(NonEmptyString, v.description("Instrument symbol.")),
    /** Position quantity as a decimal string. */
    quantity: v.pipe(NonEmptyString, v.description("Position quantity.")),
    /** Position entry price as a decimal string. */
    entry_price: v.pipe(NonEmptyString, v.description("Position entry price.")),
  }),
  v.description("Standard-margin liquidation position."),
);
export type StandardMarginLiquidationPositionRequest = v.InferOutput<
  typeof StandardMarginLiquidationPositionRequest
>;

/** Pre-signed request to submit a standard-margin liquidation bid. */
export const SubmitStandardMarginLiquidationRequest = v.pipe(
  v.object({
    /** Wallet performing the liquidation action. */
    wallet: v.pipe(WalletAddress, v.description("Liquidator wallet address.")),
    /** Wallet being liquidated. */
    liquidated_wallet: v.pipe(WalletAddress, v.description("Liquidated wallet address.")),
    /** Client-generated request ID. */
    request_id: v.pipe(NonEmptyString, v.description("Request ID.")),
    /** Auction ID. */
    auction_id: v.pipe(NonEmptyString, v.description("Auction ID.")),
    /** Bid amount in USDC. */
    bid_usdc: v.pipe(NonEmptyString, v.description("Bid USDC amount.")),
    /** Positions included in the liquidation bid. */
    positions: v.pipe(
      v.array(StandardMarginLiquidationPositionRequest),
      v.minLength(1),
      v.description("Positions."),
    ),
    /** Portfolio hash included in the signed intent. */
    portfolio_hash: v.pipe(NonEmptyString, v.description("Portfolio hash.")),
    /** Auction terms hash included in the signed intent. */
    auction_terms_hash: v.pipe(NonEmptyString, v.description("Auction terms hash.")),
    /** Auction version included in the signed intent. */
    auction_version: v.pipe(NonNegativeInteger, v.description("Auction version.")),
    /** Valuation timestamp in milliseconds. */
    valuation_timestamp_ms: v.pipe(NonNegativeInteger, v.description("Valuation timestamp.")),
    /** Bid intent hash included in the signed intent. */
    bid_intent_hash: v.pipe(NonEmptyString, v.description("Bid intent hash.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to submit a standard-margin liquidation bid."),
);
export type SubmitStandardMarginLiquidationRequest = v.InferOutput<
  typeof SubmitStandardMarginLiquidationRequest
>;

/** Parameters for the {@linkcode submitStandardMarginLiquidation} function. */
export type SubmitStandardMarginLiquidationParameters = v.InferInput<
  typeof SubmitStandardMarginLiquidationRequest
>;

/** Standard-margin liquidation order response. */
export type StandardMarginLiquidationOrderResponse = {
  /** Request ID. */
  request_id: string;
  /** Auction ID. */
  auction_id: string;
  /** Wallet being liquidated. */
  liquidated_wallet: string;
  /** Liquidator wallet. */
  liquidator_wallet: string;
};

/** Response for submitting a standard-margin liquidation bid. */
export type SubmitStandardMarginLiquidationResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Accepted liquidation order data, present on success. */
  data: StandardMarginLiquidationOrderResponse | null;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/** Request options for the {@linkcode submitStandardMarginLiquidation} function. */
export type SubmitStandardMarginLiquidationOptions = ExchangeRequestOptions;

/**
 * Submit a standard-margin liquidation bid using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `StandardMarginLiquidationOrder` payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Standard-margin liquidation submit response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { submitStandardMarginLiquidation } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await submitStandardMarginLiquidation({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   liquidated_wallet: "0x1111111111111111111111111111111111111111",
 *   request_id: "00000000-0000-0000-0000-000000000000",
 *   auction_id: "auction-1",
 *   bid_usdc: "100",
 *   positions: [{ symbol: "BTC-30JUN26-100000-C", quantity: "1", entry_price: "10" }],
 *   portfolio_hash: "0xportfolio",
 *   auction_terms_hash: "0xterms",
 *   auction_version: 1,
 *   valuation_timestamp_ms: 1,
 *   bid_intent_hash: "intent-1",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function submitStandardMarginLiquidation(
  config: ExchangeConfig,
  params: SubmitStandardMarginLiquidationParameters,
  opts?: SubmitStandardMarginLiquidationOptions,
): Promise<SubmitStandardMarginLiquidationResponse> {
  const request = parse(SubmitStandardMarginLiquidationRequest, params);

  return config.transport.request<SubmitStandardMarginLiquidationResponse>(
    "/liquidation/standard-margin",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
