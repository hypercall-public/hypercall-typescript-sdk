import * as v from "@valibot/valibot";

import { parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";
import { TeePerpAsset, type TeePerpLeverageResponse, teePerpSignedFields } from "./_base/teePerp.ts";

// -------------------- Schemas --------------------

/** Pre-signed `/v1/tee-perp/leverage/submit` request. */
export const TeePerpUpdateLeverageRequest = v.pipe(
  v.object({
    account: teePerpSignedFields.account,
    nonce: teePerpSignedFields.nonce,
    action: v.pipe(
      v.object({
        asset: TeePerpAsset,
        isCross: v.boolean(),
        leverage: v.pipe(
          v.number(),
          v.integer("Expected integer leverage"),
          v.minValue(1, "Expected leverage of at least 1"),
        ),
      }),
      v.description("Leverage and margin-mode change."),
    ),
    signature: teePerpSignedFields.signature,
  }),
  v.description("Pre-signed `/v1/tee-perp/leverage/submit` request."),
);
export type TeePerpUpdateLeverageRequest = v.InferOutput<typeof TeePerpUpdateLeverageRequest>;

/** Parameters for the {@linkcode teePerpUpdateLeverage} function. */
export type TeePerpUpdateLeverageParameters = v.InferInput<typeof TeePerpUpdateLeverageRequest>;

/** Response for the {@linkcode teePerpUpdateLeverage} function. */
export type TeePerpUpdateLeverageResponse = TeePerpLeverageResponse;

/** Request options for the {@linkcode teePerpUpdateLeverage} function. */
export type TeePerpUpdateLeverageOptions = ExchangeRequestOptions;

/**
 * Change a market's leverage and cross/isolated mode. The app key signs Hypercall's intent; the TEE API
 * wallet signs the Hyperliquid action. Read the result back with `hyperliquidActiveAssetLeverage`.
 *
 * Signing: pre-signed EIP-712 `HCPerpLeverageChange` payload in the `HypercallApiSign` domain, signed by the
 * account's API wallet (see `buildTeePerpLeverageTypedData` in `@hypercallxyz/sdk/signing`). The nonce must be a
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
 * import { teePerpUpdateLeverage } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teePerpUpdateLeverage({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   nonce: 1785672000000,
 *   action: { asset: 0, isCross: true, leverage: 5 },
 *   signature: "0x...",
 * });
 * ```
 */
export function teePerpUpdateLeverage(
  config: ExchangeConfig,
  params: TeePerpUpdateLeverageParameters,
  opts?: TeePerpUpdateLeverageOptions,
): Promise<TeePerpUpdateLeverageResponse> {
  const request = parse(TeePerpUpdateLeverageRequest, params);

  return config.transport.request<TeePerpUpdateLeverageResponse>(
    "/v1/tee-perp/leverage/submit",
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
