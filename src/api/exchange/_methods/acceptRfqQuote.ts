import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import type { RfqStatus } from "../../info/_methods/rfq.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to accept an RFQ quote. */
export const AcceptRfqQuoteRequest = v.pipe(
  v.object({
    /** RFQ ID. */
    rfq_id: v.pipe(NonEmptyString, v.description("RFQ ID.")),
    /** Quote ID. */
    quote_id: v.pipe(NonEmptyString, v.description("Quote ID.")),
    /** Wallet performing the action. */
    wallet_address: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
  }),
  v.description("Pre-signed request to accept an RFQ quote."),
);
export type AcceptRfqQuoteRequest = v.InferOutput<typeof AcceptRfqQuoteRequest>;

/** Parameters for the {@linkcode acceptRfqQuote} function. */
export type AcceptRfqQuoteParameters = v.InferInput<typeof AcceptRfqQuoteRequest>;

/** Response after accepting an RFQ quote. */
export type AcceptRfqQuoteResponse = {
  /** RFQ ID. */
  rfq_id: string;
  /** Quote ID. */
  quote_id: string;
  /** RFQ status after accepting the quote. */
  status: RfqStatus;
  /** Fill ID created by the accepted RFQ. */
  fill_id: string;
};

/** Request options for the {@linkcode acceptRfqQuote} function. */
export type AcceptRfqQuoteOptions = ExchangeRequestOptions;

/**
 * Accept an RFQ quote using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `AcceptRFQQuote` payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return RFQ accept response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { acceptRfqQuote } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await acceptRfqQuote({ transport }, {
 *   rfq_id: "00000000-0000-0000-0000-000000000000",
 *   quote_id: "11111111-1111-1111-1111-111111111111",
 *   wallet_address: "0x0000000000000000000000000000000000000000",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function acceptRfqQuote(
  config: ExchangeConfig,
  params: AcceptRfqQuoteParameters,
  opts?: AcceptRfqQuoteOptions,
): Promise<AcceptRfqQuoteResponse> {
  const request = parse(AcceptRfqQuoteRequest, params);

  return config.transport.request<AcceptRfqQuoteResponse>(
    "/rfq/accept",
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
