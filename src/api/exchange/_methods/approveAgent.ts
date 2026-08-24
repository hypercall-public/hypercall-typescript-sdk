import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to approve an agent wallet. */
export const ApproveAgentRequest = v.pipe(
  v.object({
    /** Agent wallet address to authorize. */
    agent: v.pipe(WalletAddress, v.description("Agent wallet address.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature from the wallet owner. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to approve an agent wallet."),
);
export type ApproveAgentRequest = v.InferOutput<typeof ApproveAgentRequest>;

/** Parameters for the {@linkcode approveAgent} function. */
export type ApproveAgentParameters = v.InferInput<typeof ApproveAgentRequest>;

/** Response for approving an agent. */
export type ApproveAgentResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Human-readable error message, present on failure. */
  error: string | null;
};

/** Request options for the {@linkcode approveAgent} function. */
export type ApproveAgentOptions = ExchangeRequestOptions;

/**
 * Approve an agent wallet using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `ApproveAgent` payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Agent approval response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { approveAgent } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await approveAgent({ transport }, {
 *   agent: "0x0000000000000000000000000000000000000000",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function approveAgent(
  config: ExchangeConfig,
  params: ApproveAgentParameters,
  opts?: ApproveAgentOptions,
): Promise<ApproveAgentResponse> {
  const request = parse(ApproveAgentRequest, params);

  return config.transport.request<ApproveAgentResponse>(
    "/approve-agent",
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
