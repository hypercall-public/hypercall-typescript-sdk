import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";

/** Pre-signed request to permanently set an account's referrer. */
export const SetReferrerRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Account wallet.")),
  code: v.pipe(NonEmptyString, v.description("Referral code used to resolve the referrer.")),
  referrer: v.pipe(WalletAddress, v.description("Signed referrer wallet.")),
  nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
  signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
});
export type SetReferrerRequest = v.InferOutput<typeof SetReferrerRequest>;
export type SetReferrerParameters = v.InferInput<typeof SetReferrerRequest>;
export type SetReferrerOptions = ExchangeRequestOptions;

export type SetReferrerResponse = {
  referred_wallet: string;
  referrer_wallet: string;
};

/** Permanently set an account's referrer. */
export function setReferrer(
  config: ExchangeConfig,
  params: SetReferrerParameters,
  opts?: SetReferrerOptions,
): Promise<SetReferrerResponse> {
  const request = parse(SetReferrerRequest, params);
  return config.transport.request<SetReferrerResponse>(
    "/referrals/set-referrer",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
