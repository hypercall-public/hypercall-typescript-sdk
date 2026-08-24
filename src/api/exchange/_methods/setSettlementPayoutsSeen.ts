import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to mark settlement payouts as seen. */
export const SetSettlementPayoutsSeenRequest = v.pipe(
  v.object({
    /** Wallet performing the action. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Settlement payout IDs to mark as seen. Order is preserved for signature verification. */
    ids: v.pipe(
      v.array(PositiveInteger),
      v.minLength(1, "Expected at least one settlement payout ID"),
      v.description("Settlement payout IDs."),
    ),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to mark settlement payouts as seen."),
);
export type SetSettlementPayoutsSeenRequest = v.InferOutput<typeof SetSettlementPayoutsSeenRequest>;

/** Parameters for the {@linkcode setSettlementPayoutsSeen} function. */
export type SetSettlementPayoutsSeenParameters = v.InferInput<typeof SetSettlementPayoutsSeenRequest>;

/** Response for marking settlement payouts as seen. */
export type SetSettlementPayoutsSeenResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Number of IDs requested in the payload. */
  requested: number;
  /** Number of rows affected in storage. */
  affected: number;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/** Request options for the {@linkcode setSettlementPayoutsSeen} function. */
export type SetSettlementPayoutsSeenOptions = ExchangeRequestOptions;

/**
 * Mark settlement payouts as seen using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Settlement payout seen mutation response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { setSettlementPayoutsSeen } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await setSettlementPayoutsSeen({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   ids: [123],
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function setSettlementPayoutsSeen(
  config: ExchangeConfig,
  params: SetSettlementPayoutsSeenParameters,
  opts?: SetSettlementPayoutsSeenOptions,
): Promise<SetSettlementPayoutsSeenResponse> {
  const request = parse(SetSettlementPayoutsSeenRequest, params);

  return config.transport.request<SetSettlementPayoutsSeenResponse>(
    "/settlement-payouts/seen",
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
