import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";
import type { CancelOrderResponse } from "./cancelOrder.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to cancel an order by client ID. */
export const CancelOrderByClientIdRequest = v.pipe(
  v.object({
    /** Wallet performing the action. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Client order ID to cancel. */
    client_id: v.pipe(NonEmptyString, v.description("Client order ID.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to cancel an order by client ID."),
);
export type CancelOrderByClientIdRequest = v.InferOutput<typeof CancelOrderByClientIdRequest>;

/** Parameters for the {@linkcode cancelOrderByClientId} function. */
export type CancelOrderByClientIdParameters = v.InferInput<typeof CancelOrderByClientIdRequest>;

/** Response for canceling an order by client ID. */
export type CancelOrderByClientIdResponse = CancelOrderResponse;

/** Request options for the {@linkcode cancelOrderByClientId} function. */
export type CancelOrderByClientIdOptions = ExchangeRequestOptions;

/**
 * Cancel an order by client ID using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `CancelOrderByClientId` payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Cancel order response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { cancelOrderByClientId } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await cancelOrderByClientId({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   client_id: "0x...",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function cancelOrderByClientId(
  config: ExchangeConfig,
  params: CancelOrderByClientIdParameters,
  opts?: CancelOrderByClientIdOptions,
): Promise<CancelOrderByClientIdResponse> {
  const request = parse(CancelOrderByClientIdRequest, params);

  return config.transport.request<CancelOrderByClientIdResponse>(
    "/order_cloid",
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
