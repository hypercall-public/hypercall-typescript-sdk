import type { InfoConfig } from "./_base/mod.ts";

// -------------------- Response Types --------------------

/** One configured perp market and whether the TEE routes accept it. */
export type TeePerpMarketEntry = {
  /** Hyperliquid asset id the signed order names. */
  assetId: number;
  /** Engine perp symbol, for example `SNDK-PERP`. */
  symbol: string;
  underlying: string;
  /** Exact, case-sensitive Hyperliquid coin, for example `xyz:SNDK`. */
  hyperliquidCoin: string;
  /** HIP-3 dex name for builder-deployed markets, for example `xyz`. */
  dex: string | null;
  /** Whether market-level requirements hold. Per-account venue observation is checked at order time. */
  supported: boolean;
  /** `market_not_supported` when `supported` is false. */
  reasonCode: string | null;
  /** The missing requirement, for example `price_source`. */
  missing: string | null;
  message: string | null;
};

/** Response of `GET /v1/tee-perp/markets`. */
export type TeePerpMarketsResponse = {
  markets: TeePerpMarketEntry[];
};

/**
 * List the perp markets configured for TEE trading and whether each is currently supported.
 *
 * @param config General configuration for Info API requests.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Configured TEE perp markets.
 *
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { teePerpMarkets } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const { markets } = await teePerpMarkets({ transport });
 * ```
 */
export function teePerpMarkets(config: InfoConfig, signal?: AbortSignal): Promise<TeePerpMarketsResponse> {
  return config.transport.request<TeePerpMarketsResponse>("/v1/tee-perp/markets", {}, signal);
}
