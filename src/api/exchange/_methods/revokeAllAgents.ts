import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";

/** Pre-signed request to revoke every authorized agent. */
export const RevokeAllAgentsRequest = v.object({
  nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
  signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
});
export type RevokeAllAgentsRequest = v.InferOutput<typeof RevokeAllAgentsRequest>;
export type RevokeAllAgentsParameters = v.InferInput<typeof RevokeAllAgentsRequest>;
export type RevokeAllAgentsOptions = ExchangeRequestOptions;

export type RevokeAllAgentsResponse = {
  success: boolean;
  error?: string | null;
};

/** Revoke every authorized agent using a pre-signed `RevokeAllAgents` payload. */
export function revokeAllAgents(
  config: ExchangeConfig,
  params: RevokeAllAgentsParameters,
  opts?: RevokeAllAgentsOptions,
): Promise<RevokeAllAgentsResponse> {
  const request = parse(RevokeAllAgentsRequest, params);
  return config.transport.request<RevokeAllAgentsResponse>(
    "/revoke-all-agents",
    {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    },
    opts?.signal,
  );
}
