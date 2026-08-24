import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Owner-signed request to withdraw USDC from Hypercall to Hyperliquid. */
export const WithdrawUsdcRequest = v.pipe(
  v.object({
    /** Owner wallet performing the withdrawal. */
    wallet: v.pipe(WalletAddress, v.description("Owner wallet address.")),
    /** Hypercall account to debit. */
    account: v.pipe(WalletAddress, v.description("Hypercall account address.")),
    /** Hyperliquid recipient wallet. */
    destination: v.pipe(WalletAddress, v.description("Hyperliquid recipient wallet address.")),
    /** USDC amount as a decimal string. */
    amount: v.pipe(NonEmptyString, v.description("USDC amount.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature from the wallet owner. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Owner-signed request to withdraw USDC from Hypercall to Hyperliquid."),
);
export type WithdrawUsdcRequest = v.InferOutput<typeof WithdrawUsdcRequest>;

/** Parameters for the {@linkcode withdrawUsdc} function. */
export type WithdrawUsdcParameters = v.InferInput<typeof WithdrawUsdcRequest>;

/** Response for submitting a Hypercall USDC withdrawal. */
export type WithdrawUsdcResponse = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Idempotency request ID generated for the withdrawal. */
  request_id: string;
  /** Directive ID used for withdrawal status tracking. */
  directive_id: string;
  /** Current directive domain status. */
  domain_status: string;
  /** Current directive delivery status. */
  delivery_status: string;
  /** Remaining account balance after the accepted withdrawal. */
  balance_after: string;
  /** Human-readable status message. */
  message: string;
};

/** Request options for the {@linkcode withdrawUsdc} function. */
export type WithdrawUsdcOptions = ExchangeRequestOptions;

/**
 * Withdraw USDC from Hypercall to Hyperliquid using an owner-signed payload.
 *
 * Signing: pre-signed EIP-712 `WithdrawUsdc` payload. The backend rejects
 * authorized-agent signatures for this endpoint.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Owner-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return USDC withdrawal submit response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { withdrawUsdc } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await withdrawUsdc({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   account: "0x0000000000000000000000000000000000000000",
 *   destination: "0x0000000000000000000000000000000000000000",
 *   amount: "100",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function withdrawUsdc(
  config: ExchangeConfig,
  params: WithdrawUsdcParameters,
  opts?: WithdrawUsdcOptions,
): Promise<WithdrawUsdcResponse> {
  const request = parse(WithdrawUsdcRequest, params);

  return config.transport.request<WithdrawUsdcResponse>(
    "/withdraw/usdc",
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
