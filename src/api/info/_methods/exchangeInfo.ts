import * as v from "@valibot/valibot";

import type { Address } from "./_base/_schemas.ts";
import type { InfoConfig } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request exchange metadata. */
export const ExchangeInfoRequest = v.pipe(
  v.object({}),
  v.description("Request exchange metadata."),
);
export type ExchangeInfoRequest = v.InferOutput<typeof ExchangeInfoRequest>;

/** EIP-712 signing domain metadata. */
export type SigningDomainInfo = {
  /** Domain name. */
  name: string;
  /** Domain version. */
  version: string;
};

/** Public exchange metadata used for funding and signing. */
export type ExchangeInfoResponse = {
  /** Exchange contract address on HyperEVM. */
  exchange_address: Address;
  /** Chain ID for EIP-712 signing. */
  chain_id: number;
  /** EIP-712 signing domain info. */
  signing_domain: SigningDomainInfo;
  /**
   * Hyperliquid builder attached to every TEE perp order. Accounts approve it once with
   * `Account.approveZeroFeeBuilder(builder)`; see `resolveHypercallBuilderAddress`.
   */
  hl_builder_address?: Address | null;
};

/**
 * Request exchange metadata.
 *
 * @param config General configuration for Info API requests.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Exchange metadata response.
 *
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { exchangeInfo } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await exchangeInfo({ transport });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function exchangeInfo(
  config: InfoConfig,
  signal?: AbortSignal,
): Promise<ExchangeInfoResponse> {
  return config.transport.request<ExchangeInfoResponse>("/exchange-info", {}, signal);
}
