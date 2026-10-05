import * as v from "@valibot/valibot";

import { NonEmptyString, parse, WalletAddress } from "../../_base.ts";
import type { InfoConfig } from "./_base/mod.ts";

/**
 * Hyperliquid info reads used by the TEE perp flow. Pass a transport whose
 * `apiUrl` is the Hyperliquid API, for example
 * `new HttpTransport({ apiUrl: HYPERLIQUID_MAINNET_API_URL })`.
 */

/** Hyperliquid mainnet API URL (pairs with HyperEVM chain 999). */
export const HYPERLIQUID_MAINNET_API_URL = "https://api.hyperliquid.xyz";
/** Hyperliquid testnet API URL (pairs with HyperEVM chain 998). */
export const HYPERLIQUID_TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";

// -------------------- Schemas --------------------

/** Request a Hyperliquid user's role. */
export const HyperliquidUserRoleRequest = v.object({
  /** Address to look up, for example the TEE API wallet. */
  user: WalletAddress,
});
export type HyperliquidUserRoleParameters = v.InferInput<typeof HyperliquidUserRoleRequest>;

/** Hyperliquid `userRole` response. An API wallet reads `{ role: "agent", data: { user } }`. */
export type HyperliquidUserRoleResponse = {
  role: string;
  data?: { user?: string } | null;
};

/**
 * Read the Hyperliquid role of an address.
 *
 * @param config Info configuration whose transport points at the Hyperliquid API.
 * @param params Address to look up.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Hyperliquid role.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { HYPERLIQUID_MAINNET_API_URL, hyperliquidUserRole } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: HYPERLIQUID_MAINNET_API_URL });
 * const role = await hyperliquidUserRole({ transport }, { user: "0x0000000000000000000000000000000000000000" });
 * ```
 */
export function hyperliquidUserRole(
  config: InfoConfig,
  params: HyperliquidUserRoleParameters,
  signal?: AbortSignal,
): Promise<HyperliquidUserRoleResponse> {
  const request = parse(HyperliquidUserRoleRequest, params);
  return config.transport.request<HyperliquidUserRoleResponse>(
    "/info",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "userRole", user: request.user }),
    },
    signal,
  );
}

/**
 * Whether a `userRole` result shows the TEE API wallet enrolled for `account`: the
 * role is `agent` and its `data.user` is the account.
 */
export function isTeeApiWalletActiveForAccount(role: unknown, account: string): boolean {
  if (!/^0x[0-9a-fA-F]{40}$/.test(account) || !role || typeof role !== "object") return false;
  const candidate = role as { role?: unknown; data?: { user?: unknown } | null };
  const user = candidate.data?.user;
  return candidate.role === "agent" && typeof user === "string" && user.toLowerCase() === account.toLowerCase();
}

/** Request one account's active asset data on Hyperliquid. */
export const HyperliquidActiveAssetDataRequest = v.object({
  /** Account.sol address. */
  user: WalletAddress,
  /** Exact, case-sensitive Hyperliquid coin, for example `BTC` or `xyz:SNDK`. */
  coin: NonEmptyString,
});
export type HyperliquidActiveAssetDataParameters = v.InferInput<typeof HyperliquidActiveAssetDataRequest>;

/** Hyperliquid `activeAssetData` response (fields the SDK relies on). */
export type HyperliquidActiveAssetDataResponse = {
  user: string;
  coin: string;
  leverage: { type: string; value: number; rawUsd?: string };
  maxTradeSzs?: [string, string];
  availableToTrade?: [string, string];
  markPx?: string;
};

/** A market's leverage setting. */
export type PerpLeverage = { mode: "cross" | "isolated"; value: number };

/**
 * Read back a market's leverage and margin mode from Hyperliquid, for example after
 * `teePerpUpdateLeverage`. Throws when Hyperliquid echoes a different account or coin, or
 * returns an invalid setting.
 *
 * @param config Info configuration whose transport points at the Hyperliquid API.
 * @param params Account and coin.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Leverage setting.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { HYPERLIQUID_MAINNET_API_URL, hyperliquidActiveAssetLeverage } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: HYPERLIQUID_MAINNET_API_URL });
 * const leverage = await hyperliquidActiveAssetLeverage({ transport }, {
 *   user: "0x0000000000000000000000000000000000000000",
 *   coin: "BTC",
 * });
 * ```
 */
export async function hyperliquidActiveAssetLeverage(
  config: InfoConfig,
  params: HyperliquidActiveAssetDataParameters,
  signal?: AbortSignal,
): Promise<PerpLeverage> {
  const request = parse(HyperliquidActiveAssetDataRequest, params);
  const result = await config.transport.request<HyperliquidActiveAssetDataResponse>(
    "/info",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "activeAssetData", user: request.user, coin: request.coin }),
    },
    signal,
  );
  return parseHyperliquidLeverage(result, request.user, request.coin);
}

/** Validate an `activeAssetData` result for `user` and `coin` and extract its leverage. */
export function parseHyperliquidLeverage(
  result: HyperliquidActiveAssetDataResponse,
  user: string,
  coin: string,
): PerpLeverage {
  if (typeof result?.user !== "string" || result.user.toLowerCase() !== user.toLowerCase() || result.coin !== coin) {
    throw new Error("Hyperliquid returned leverage for a different account or market");
  }
  const { type, value } = result.leverage ?? {};
  if ((type !== "cross" && type !== "isolated") || !Number.isInteger(value) || value < 1) {
    throw new Error("Hyperliquid returned an invalid leverage setting");
  }
  return { mode: type, value };
}
