import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Margin mode accepted by Hypercall account write endpoints. */
export const MarginModeSelection = v.picklist(["standard", "portfolio"]);
export type MarginModeSelection = v.InferOutput<typeof MarginModeSelection>;

/** Pre-signed request to set account margin mode. */
export const SetMarginModeRequest = v.pipe(
  v.object({
    /** Wallet performing the action. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Requested margin mode. */
    margin_mode: v.pipe(MarginModeSelection, v.description("Margin mode.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to set account margin mode."),
);
export type SetMarginModeRequest = v.InferOutput<typeof SetMarginModeRequest>;

/** Parameters for the {@linkcode setMarginMode} function. */
export type SetMarginModeParameters = v.InferInput<typeof SetMarginModeRequest>;

/** Margin mode change details returned by the backend on success. */
export type MarginModeResponse = {
  /** Wallet address whose margin mode was updated. */
  wallet: string;
  /** New margin mode after the switch. */
  margin_mode: string;
  /** Margin mode before the switch. */
  previous_mode: string;
};

/** Response envelope for setting margin mode. */
export type SetMarginModeResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Margin mode change details, present on success. */
  data: MarginModeResponse | null;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/** Request options for the {@linkcode setMarginMode} function. */
export type SetMarginModeOptions = ExchangeRequestOptions;

/**
 * Set account margin mode using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `SetMarginMode` payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Margin mode update response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { setMarginMode } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await setMarginMode({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   margin_mode: "standard",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function setMarginMode(
  config: ExchangeConfig,
  params: SetMarginModeParameters,
  opts?: SetMarginModeOptions,
): Promise<SetMarginModeResponse> {
  const request = parse(SetMarginModeRequest, params);

  return config.transport.request<SetMarginModeResponse>(
    "/margin-mode",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
