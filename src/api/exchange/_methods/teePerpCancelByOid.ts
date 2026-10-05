import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";
import { TeePerpAsset, teePerpSignedFields, TeePerpUnits, type TeePerpVenueActionResponse } from "./_base/teePerp.ts";

// -------------------- Schemas --------------------

/** Pre-signed `/v1/tee-perp/cancels/submit-by-oid` request. */
export const TeePerpCancelByOidRequest = v.pipe(
  v.object({
    account: teePerpSignedFields.account,
    nonce: teePerpSignedFields.nonce,
    action: v.pipe(
      v.object({ asset: TeePerpAsset, oid: TeePerpUnits }),
      v.description("Cancel by Hyperliquid order id."),
    ),
    signature: teePerpSignedFields.signature,
  }),
  v.description("Pre-signed `/v1/tee-perp/cancels/submit-by-oid` request."),
);
export type TeePerpCancelByOidRequest = v.InferOutput<typeof TeePerpCancelByOidRequest>;

/** Parameters for the {@linkcode teePerpCancelByOid} function. */
export type TeePerpCancelByOidParameters = v.InferInput<typeof TeePerpCancelByOidRequest>;

/** Response for the {@linkcode teePerpCancelByOid} function. */
export type TeePerpCancelByOidResponse = TeePerpVenueActionResponse;

/** Request options for the {@linkcode teePerpCancelByOid} function. */
export type TeePerpCancelByOidOptions = ExchangeRequestOptions;

/**
 * Cancel one TEE perp order by Hyperliquid order id.
 *
 * Signing: pre-signed EIP-712 `HLCancel` payload in the `HypercallApiSign` domain, signed by the
 * account's API wallet (see `buildTeePerpCancelByOidTypedData` in `@hypercallxyz/sdk/signing`). The nonce must be a
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
 * import { teePerpCancelByOid } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpCancelByOid({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   nonce: 1785672000000,
 *   action: { asset: 0, oid: "123456789" },
 *   signature: "0x...",
 * });
 * ```
 */
export function teePerpCancelByOid(
  config: ExchangeConfig,
  params: TeePerpCancelByOidParameters,
  opts?: TeePerpCancelByOidOptions,
): Promise<TeePerpCancelByOidResponse> {
  const request = parse(TeePerpCancelByOidRequest, params);

  return config.transport.request<TeePerpCancelByOidResponse>(
    "/v1/tee-perp/cancels/submit-by-oid",
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
