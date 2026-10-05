import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";
import {
  type TeePerpOrderBatchResponse,
  TeePerpOrderGroupingSchema,
  TeePerpOrderWireSchema,
  teePerpSignedFields,
} from "./_base/teePerp.ts";

// -------------------- Schemas --------------------

/** Pre-signed `/v1/tee-perp/orders/submit-batch` request. */
export const TeePerpSubmitOrderBatchRequest = v.pipe(
  v.object({
    account: teePerpSignedFields.account,
    nonce: teePerpSignedFields.nonce,
    action: v.pipe(
      v.object({
        orders: v.pipe(
          v.array(TeePerpOrderWireSchema),
          v.minLength(1, "Expected at least one order"),
          v.maxLength(100, "Expected at most 100 orders"),
          v.check(
            (orders) => new Set(orders.map((order) => order.cloid)).size === orders.length,
            "Expected every order in a batch to use a distinct cloid",
          ),
        ),
        grouping: TeePerpOrderGroupingSchema,
      }),
      v.description("Native order batch."),
    ),
    signature: teePerpSignedFields.signature,
  }),
  v.description("Pre-signed `/v1/tee-perp/orders/submit-batch` request."),
);
export type TeePerpSubmitOrderBatchRequest = v.InferOutput<typeof TeePerpSubmitOrderBatchRequest>;

/** Parameters for the {@linkcode teePerpSubmitOrderBatch} function. */
export type TeePerpSubmitOrderBatchParameters = v.InferInput<typeof TeePerpSubmitOrderBatchRequest>;

/** Response for the {@linkcode teePerpSubmitOrderBatch} function. */
export type TeePerpSubmitOrderBatchResponse = TeePerpOrderBatchResponse;

/** Request options for the {@linkcode teePerpSubmitOrderBatch} function. */
export type TeePerpSubmitOrderBatchOptions = ExchangeRequestOptions;

/**
 * Submit one app-key-signed native order batch: scale orders (`na`), an entry with TP/SL exits
 * (`normalTpsl`), or exits on an existing position (`positionTpsl`).
 *
 * Signing: pre-signed EIP-712 `HCPerpOrderBatch` payload in the `HypercallApiSign` domain, signed by the
 * account's API wallet (see `buildTeePerpOrderBatchTypedData` in `@hypercallxyz/sdk/signing`). The nonce must be a
 * server-clock millisecond timestamp: the server derives the venue expiry as `nonce + 9000` and
 * accepts it only inside its own 10 second window.
 *
 * Inspect `stage`: only `accepted` means the venue accepted the action. `errorCode`
 * `builder_not_approved` means the account must call `Account.approveZeroFeeBuilder` first.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Same-call TEE submission result.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { teePerpSubmitOrderBatch } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpSubmitOrderBatch({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   nonce: 1785672000000,
 *   action: { orders: [], grouping: "na" },
 *   signature: "0x...",
 * });
 * ```
 */
export function teePerpSubmitOrderBatch(
  config: ExchangeConfig,
  params: TeePerpSubmitOrderBatchParameters,
  opts?: TeePerpSubmitOrderBatchOptions,
): Promise<TeePerpSubmitOrderBatchResponse> {
  const request = parse(TeePerpSubmitOrderBatchRequest, params);

  return config.transport.request<TeePerpSubmitOrderBatchResponse>(
    "/v1/tee-perp/orders/submit-batch",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    },
    opts?.signal,
  );
}
