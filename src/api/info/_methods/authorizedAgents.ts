import * as v from "@valibot/valibot";

import { parse, WalletAddress } from "../../_base.ts";
import type { Address } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request authorized agents for a wallet. */
export const AuthorizedAgentsRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
  }),
  v.description("Request authorized agents for a wallet."),
);
export type AuthorizedAgentsRequest = v.InferOutput<typeof AuthorizedAgentsRequest>;

/** Request parameters for the {@linkcode authorizedAgents} function. */
export type AuthorizedAgentsParameters = v.InferInput<typeof AuthorizedAgentsRequest>;

/** Authorized agent wallet address response. */
export type AuthorizedAgentsResponse = {
  /** Agent wallet addresses authorized by the owner wallet. */
  agents: Address[];
};

/**
 * Request authorized agents for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Authorized agents response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { authorizedAgents } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await authorizedAgents({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function authorizedAgents(
  config: InfoConfig,
  params: AuthorizedAgentsParameters,
  signal?: AbortSignal,
): Promise<AuthorizedAgentsResponse> {
  const request = parse(AuthorizedAgentsRequest, params);
  const query = toQuery({ wallet: request.wallet.toLowerCase() });

  return config.transport.request<AuthorizedAgentsResponse>(`/authorized-agents?${query}`, {}, signal);
}
