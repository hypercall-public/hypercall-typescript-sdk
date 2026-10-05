import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";
import { HlLimitOrderActionSchema, type TeePerpOrderResponse, teePerpSignedFields } from "./_base/teePerp.ts";

// -------------------- Schemas --------------------

/** Pre-signed `/v1/tee-perp/orders/submit` request. */
export const TeePerpSubmitOrderRequest = v.pipe(
  v.object({
    account: teePerpSignedFields.account,
    nonce: teePerpSignedFields.nonce,
    action: v.pipe(HlLimitOrderActionSchema, v.description("Limit order action.")),
    signature: teePerpSignedFields.signature,
  }),
  v.description("Pre-signed `/v1/tee-perp/orders/submit` request."),
);
export type TeePerpSubmitOrderRequest = v.InferOutput<typeof TeePerpSubmitOrderRequest>;

/** Parameters for the {@linkcode teePerpSubmitOrder} function. */
export type TeePerpSubmitOrderParameters = v.InferInput<typeof TeePerpSubmitOrderRequest>;

/** Response for the {@linkcode teePerpSubmitOrder} function. */
export type TeePerpSubmitOrderResponse = TeePerpOrderResponse;

/** Request options for the {@linkcode teePerpSubmitOrder} function. */
export type TeePerpSubmitOrderOptions = ExchangeRequestOptions;

/**
 * Submit one app-key-signed limit order (GTC, IOC, or ALO) through the TEE rail. A market order is an
 * IOC limit at a slippage-bounded price (see `formatPerpMarketLimitPrice`).
 *
 * Signing: pre-signed EIP-712 `HLOrder` payload in the `HypercallApiSign` domain, signed by the
 * account's API wallet (see `buildTeePerpLimitOrderTypedData` in `@hypercallxyz/sdk/signing`). The nonce must be a
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
 * import { teePerpSubmitOrder } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpSubmitOrder({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   nonce: 1785672000000,
 *   action: {
 *     asset: 0,
 *     isBuy: true,
 *     limitPx: "10000000000000",
 *     sz: "100000",
 *     reduceOnly: false,
 *     encodedTif: 2,
 *     cloid: "1785672000000",
 *   },
 *   signature: "0x...",
 * });
 * ```
 */
export function teePerpSubmitOrder(
  config: ExchangeConfig,
  params: TeePerpSubmitOrderParameters,
  opts?: TeePerpSubmitOrderOptions,
): Promise<TeePerpSubmitOrderResponse> {
  const request = parse(TeePerpSubmitOrderRequest, params);

  return config.transport.request<TeePerpSubmitOrderResponse>(
    "/v1/tee-perp/orders/submit",
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
