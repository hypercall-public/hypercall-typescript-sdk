import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";
import type { OrderUpdateMessage } from "./_base/order.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to cancel an order by order ID. */
export const CancelOrderRequest = v.pipe(
  v.object({
    /** Wallet performing the action. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Order ID to cancel. */
    order_id: v.pipe(PositiveInteger, v.description("Order ID.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to cancel an order by order ID."),
);
export type CancelOrderRequest = v.InferOutput<typeof CancelOrderRequest>;

/** Parameters for the {@linkcode cancelOrder} function. */
export type CancelOrderParameters = v.InferInput<typeof CancelOrderRequest>;

/** Response for canceling an order. */
export type CancelOrderResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Order update, present when the backend returns a processed cancel result. */
  data: OrderUpdateMessage | null;
  /** Human-readable error message, present on failure. */
  error?: string | null;
};

/** Request options for the {@linkcode cancelOrder} function. */
export type CancelOrderOptions = ExchangeRequestOptions;

/**
 * Cancel an order by order ID using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `CancelOrder` payload.
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
 * import { cancelOrder } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await cancelOrder({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   order_id: 123,
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function cancelOrder(
  config: ExchangeConfig,
  params: CancelOrderParameters,
  opts?: CancelOrderOptions,
): Promise<CancelOrderResponse> {
  const request = parse(CancelOrderRequest, params);

  return config.transport.request<CancelOrderResponse>(
    "/order",
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
