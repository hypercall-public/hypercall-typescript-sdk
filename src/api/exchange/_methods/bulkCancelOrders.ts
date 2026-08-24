import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";
import type { OrderUpdateMessage } from "./_base/order.ts";
import { CancelOrderRequest } from "./cancelOrder.ts";

const MAX_BULK_CANCELS = 50;

// -------------------- Schemas --------------------

/** Pre-signed request to cancel multiple orders by order ID. */
export const BulkCancelOrdersRequest = v.pipe(
  v.object({
    /** Cancel requests by order ID. */
    cancels: v.pipe(
      v.array(CancelOrderRequest),
      v.minLength(1, "Expected at least one cancel request"),
      v.maxLength(MAX_BULK_CANCELS, `Expected at most ${MAX_BULK_CANCELS} cancel requests`),
      v.description("Cancel requests by order ID."),
    ),
  }),
  v.description("Pre-signed request to cancel multiple orders by order ID."),
);
export type BulkCancelOrdersRequest = v.InferOutput<typeof BulkCancelOrdersRequest>;

/** Parameters for the {@linkcode bulkCancelOrders} function. */
export type BulkCancelOrdersParameters = v.InferInput<typeof BulkCancelOrdersRequest>;

/** Per-cancel result returned by bulk cancel endpoints. */
export type BulkCancelOrderResult = {
  /** Index within the submitted bulk cancel request. */
  index: number;
  /** Whether this cancel succeeded. */
  success: boolean;
  /** Order update, present on processed cancels. */
  data?: OrderUpdateMessage | null;
  /** Human-readable error message, present on failure. */
  error?: string | null;
};

/** Response for canceling multiple orders by order ID. */
export type BulkCancelOrdersResponse = {
  /** Per-cancel results in request order. */
  results: BulkCancelOrderResult[];
};

/** Request options for the {@linkcode bulkCancelOrders} function. */
export type BulkCancelOrdersOptions = ExchangeRequestOptions;

/**
 * Cancel multiple orders by order ID using pre-signed Hypercall EIP-712 payloads.
 *
 * Signing: pre-signed EIP-712 `CancelOrder` payloads.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Bulk cancel response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { bulkCancelOrders } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await bulkCancelOrders({ transport }, {
 *   cancels: [{
 *     wallet: "0x0000000000000000000000000000000000000000",
 *     order_id: 123,
 *     nonce: 1,
 *     signature: "0x...",
 *   }],
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function bulkCancelOrders(
  config: ExchangeConfig,
  params: BulkCancelOrdersParameters,
  opts?: BulkCancelOrdersOptions,
): Promise<BulkCancelOrdersResponse> {
  const request = parse(BulkCancelOrdersRequest, params);

  return config.transport.request<BulkCancelOrdersResponse>(
    "/bulk_order",
    {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cancels: request.cancels.map(buildSignedBody),
      }),
    },
    opts?.signal,
  );
}
