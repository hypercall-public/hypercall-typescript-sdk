import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Address, Decimal, Pagination } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

const ReferralWalletRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
});

export type ReferralBinding = {
  referred_wallet: Address;
  referrer_wallet: Address | null;
};

export type ReferralCode = {
  code: string;
  owner_wallet: Address;
  created_at: string;
};

export type ReferredWallet = {
  referred_wallet: Address;
  volume_usd: Decimal;
};

export type ReferredWalletsResponse = {
  referrer_wallet: Address;
  data: ReferredWallet[];
  pagination: Pagination;
};

export type ReferralBindingParameters = v.InferInput<typeof ReferralWalletRequest>;
export type ReferralCodeByOwnerParameters = v.InferInput<typeof ReferralWalletRequest>;

export const ReferralCodeRequest = v.object({
  code: v.pipe(NonEmptyString, v.description("Referral code.")),
});
export type ReferralCodeParameters = v.InferInput<typeof ReferralCodeRequest>;

export const ReferredWalletsRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Referrer wallet address.")),
  limit: v.pipe(v.optional(v.pipe(PositiveInteger, v.maxValue(100))), v.description("Limit.")),
  offset: v.pipe(v.optional(NonNegativeInteger), v.description("Offset.")),
});
export type ReferredWalletsParameters = v.InferInput<typeof ReferredWalletsRequest>;

/** Return the projected referral binding for a wallet. */
export function referralBinding(
  config: InfoConfig,
  params: ReferralBindingParameters,
  signal?: AbortSignal,
): Promise<ReferralBinding> {
  const request = parse(ReferralWalletRequest, params);
  const query = toQuery({ wallet: request.wallet.toLowerCase() });
  return config.transport.request<ReferralBinding>(`/referrals/binding?${query}`, {}, signal);
}

/** Return the permanent referral code owned by a wallet, if one exists. */
export function referralCodeByOwner(
  config: InfoConfig,
  params: ReferralCodeByOwnerParameters,
  signal?: AbortSignal,
): Promise<ReferralCode | null> {
  const request = parse(ReferralWalletRequest, params);
  const query = toQuery({ wallet: request.wallet.toLowerCase() });
  return config.transport.request<ReferralCode | null>(`/referrals/code?${query}`, {}, signal);
}

/** Resolve a referral code to its owner. */
export function referralCode(
  config: InfoConfig,
  params: ReferralCodeParameters,
  signal?: AbortSignal,
): Promise<ReferralCode> {
  const request = parse(ReferralCodeRequest, params);
  return config.transport.request<ReferralCode>(`/referrals/code/${encodeURIComponent(request.code)}`, {}, signal);
}

/** Return referred wallets and their projected lifetime Hypercall fill volume. */
export function referredWallets(
  config: InfoConfig,
  params: ReferredWalletsParameters,
  signal?: AbortSignal,
): Promise<ReferredWalletsResponse> {
  const request = parse(ReferredWalletsRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    limit: request.limit,
    offset: request.offset,
  });
  return config.transport.request<ReferredWalletsResponse>(`/referrals/referred?${query}`, {}, signal);
}
