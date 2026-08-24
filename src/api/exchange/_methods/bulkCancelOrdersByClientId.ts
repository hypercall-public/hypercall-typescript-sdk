import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";
import type { BulkCancelOrderResult } from "./bulkCancelOrders.ts";
import { CancelOrderByClientIdRequest } from "./cancelOrderByClientId.ts";

const MAX_BULK_CANCELS = 50;

// -------------------- Schemas --------------------

/** Pre-signed request to cancel multiple orders by client ID. */
export const BulkCancelOrdersByClientIdRequest = v.pipe(
  v.object({
    /** Cancel requests by client ID. */
    cancels: v.pipe(
      v.array(CancelOrderByClientIdRequest),
      v.minLength(1, "Expected at least one cancel request"),
      v.maxLength(MAX_BULK_CANCELS, `Expected at most ${MAX_BULK_CANCELS} cancel requests`),
      v.description("Cancel requests by client ID."),
    ),
  }),
  v.description("Pre-signed request to cancel multiple orders by client ID."),
);
export type BulkCancelOrdersByClientIdRequest = v.InferOutput<typeof BulkCancelOrdersByClientIdRequest>;

/** Parameters for the {@linkcode bulkCancelOrdersByClientId} function. */
export type BulkCancelOrdersByClientIdParameters = v.InferInput<typeof BulkCancelOrdersByClientIdRequest>;

/** Response for canceling multiple orders by client ID. */
export type BulkCancelOrdersByClientIdResponse = {
  /** Per-cancel results in request order. */
  results: BulkCancelOrderResult[];
};

/** Request options for the {@linkcode bulkCancelOrdersByClientId} function. */
export type BulkCancelOrdersByClientIdOptions = ExchangeRequestOptions;

/**
 * Cancel multiple orders by client ID using pre-signed Hypercall EIP-712 payloads.
 *
 * Signing: pre-signed EIP-712 `CancelOrderByClientId` payloads.
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
 * import { bulkCancelOrdersByClientId } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await bulkCancelOrdersByClientId({ transport }, {
 *   cancels: [{
 *     wallet: "0x0000000000000000000000000000000000000000",
 *     client_id: "client-123",
 *     nonce: 1,
 *     signature: "0x...",
 *   }],
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function bulkCancelOrdersByClientId(
  config: ExchangeConfig,
  params: BulkCancelOrdersByClientIdParameters,
  opts?: BulkCancelOrdersByClientIdOptions,
): Promise<BulkCancelOrdersByClientIdResponse> {
  const request = parse(BulkCancelOrdersByClientIdRequest, params);

  return config.transport.request<BulkCancelOrdersByClientIdResponse>(
    "/bulk_order_cloid",
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
