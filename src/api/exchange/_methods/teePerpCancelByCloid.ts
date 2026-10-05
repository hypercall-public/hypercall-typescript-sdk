import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";
import { TeePerpAsset, type TeePerpCancelResponse, TeePerpCloid, teePerpSignedFields } from "./_base/teePerp.ts";

// -------------------- Schemas --------------------

/** Pre-signed `/v1/tee-perp/cancels/submit` request. */
export const TeePerpCancelByCloidRequest = v.pipe(
  v.object({
    account: teePerpSignedFields.account,
    nonce: teePerpSignedFields.nonce,
    action: v.pipe(v.object({ asset: TeePerpAsset, cloid: TeePerpCloid }), v.description("Cancel by cloid.")),
    signature: teePerpSignedFields.signature,
  }),
  v.description("Pre-signed `/v1/tee-perp/cancels/submit` request."),
);
export type TeePerpCancelByCloidRequest = v.InferOutput<typeof TeePerpCancelByCloidRequest>;

/** Parameters for the {@linkcode teePerpCancelByCloid} function. */
export type TeePerpCancelByCloidParameters = v.InferInput<typeof TeePerpCancelByCloidRequest>;

/** Response for the {@linkcode teePerpCancelByCloid} function. */
export type TeePerpCancelByCloidResponse = TeePerpCancelResponse;

/** Request options for the {@linkcode teePerpCancelByCloid} function. */
export type TeePerpCancelByCloidOptions = ExchangeRequestOptions;

/**
 * Cancel one TEE perp order by client order id.
 *
 * Signing: pre-signed EIP-712 `HLCancelByCloid` payload in the `HypercallApiSign` domain, signed by the
 * account's API wallet (see `buildTeePerpCancelByCloidTypedData` in `@hypercallxyz/sdk/signing`). The nonce must be a
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
 * import { teePerpCancelByCloid } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpCancelByCloid({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   nonce: 1785672000000,
 *   action: { asset: 0, cloid: "1785672000000" },
 *   signature: "0x...",
 * });
 * ```
 */
export function teePerpCancelByCloid(
  config: ExchangeConfig,
  params: TeePerpCancelByCloidParameters,
  opts?: TeePerpCancelByCloidOptions,
): Promise<TeePerpCancelByCloidResponse> {
  const request = parse(TeePerpCancelByCloidRequest, params);

  return config.transport.request<TeePerpCancelByCloidResponse>(
    "/v1/tee-perp/cancels/submit",
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
