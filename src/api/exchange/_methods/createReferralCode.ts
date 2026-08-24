import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";

/** Pre-signed request to create a referral code. */
export const CreateReferralCodeRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Account wallet.")),
  code: v.pipe(NonEmptyString, v.description("Exact signed referral code.")),
  nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
  signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
});
export type CreateReferralCodeRequest = v.InferOutput<typeof CreateReferralCodeRequest>;
export type CreateReferralCodeParameters = v.InferInput<typeof CreateReferralCodeRequest>;
export type CreateReferralCodeOptions = ExchangeRequestOptions;

export type CreateReferralCodeResponse = {
  code: string;
  owner_wallet: string;
  created_at: string;
};

/** Create an account's permanent referral code. */
export function createReferralCode(
  config: ExchangeConfig,
  params: CreateReferralCodeParameters,
  opts?: CreateReferralCodeOptions,
): Promise<CreateReferralCodeResponse> {
  const request = parse(CreateReferralCodeRequest, params);
  return config.transport.request<CreateReferralCodeResponse>(
    "/referrals/code",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
