import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";
import { type TeePerpOrderBatchResponse, TeePerpOrderWireSchema, teePerpSignedFields } from "./_base/teePerp.ts";

// -------------------- Schemas --------------------

/** Pre-signed `/v1/tee-perp/orders/submit-trigger` request. */
export const TeePerpSubmitTriggerOrderRequest = v.pipe(
  v.object({
    account: teePerpSignedFields.account,
    nonce: teePerpSignedFields.nonce,
    action: v.pipe(
      TeePerpOrderWireSchema,
      v.check((order) => "trigger" in order.orderType, "Expected action.orderType to be a trigger"),
      v.description("One stop or take-profit order."),
    ),
    signature: teePerpSignedFields.signature,
  }),
  v.description("Pre-signed `/v1/tee-perp/orders/submit-trigger` request."),
);
export type TeePerpSubmitTriggerOrderRequest = v.InferOutput<typeof TeePerpSubmitTriggerOrderRequest>;

/** Parameters for the {@linkcode teePerpSubmitTriggerOrder} function. */
export type TeePerpSubmitTriggerOrderParameters = v.InferInput<typeof TeePerpSubmitTriggerOrderRequest>;

/** Response for the {@linkcode teePerpSubmitTriggerOrder} function. */
export type TeePerpSubmitTriggerOrderResponse = TeePerpOrderBatchResponse;

/** Request options for the {@linkcode teePerpSubmitTriggerOrder} function. */
export type TeePerpSubmitTriggerOrderOptions = ExchangeRequestOptions;

/**
 * Submit one app-key-signed native stop or take-profit order (market or limit trigger). The server
 * submits it as a batch of one with grouping `na`.
 *
 * Signing: pre-signed EIP-712 `HCPerpTriggerOrder` payload in the `HypercallApiSign` domain, signed by the
 * account's API wallet (see `buildTeePerpTriggerOrderTypedData` in `@hypercallxyz/sdk/signing`). The nonce must be a
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
 * import { teePerpSubmitTriggerOrder } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpSubmitTriggerOrder({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   nonce: 1785672000000,
 *   action: {
 *     asset: 0,
 *     isBuy: false,
 *     limitPx: "7600000000000",
 *     sz: "100000",
 *     reduceOnly: true,
 *     orderType: { trigger: { triggerPx: "9500000000000", isMarket: true, tpsl: "sl" } },
 *     cloid: "457132032000001",
 *   },
 *   signature: "0x...",
 * });
 * ```
 */
export function teePerpSubmitTriggerOrder(
  config: ExchangeConfig,
  params: TeePerpSubmitTriggerOrderParameters,
  opts?: TeePerpSubmitTriggerOrderOptions,
): Promise<TeePerpSubmitTriggerOrderResponse> {
  const request = parse(TeePerpSubmitTriggerOrderRequest, params);

  return config.transport.request<TeePerpSubmitTriggerOrderResponse>(
    "/v1/tee-perp/orders/submit-trigger",
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
