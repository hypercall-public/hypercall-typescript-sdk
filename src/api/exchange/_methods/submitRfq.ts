import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import type { RfqStatusResponse } from "../../info/_methods/rfq.ts";
import { OrderSide } from "./_base/order.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** RFQ leg accepted by Hypercall RFQ submit endpoints. */
export const SubmitRfqLeg = v.pipe(
  v.object({
    /** Instrument symbol. */
    instrument: v.pipe(NonEmptyString, v.description("Instrument symbol.")),
    /** Requested side. */
    side: v.pipe(OrderSide, v.description("Requested side.")),
    /** Requested size as a decimal string. */
    size: v.pipe(NonEmptyString, v.description("Requested size.")),
  }),
  v.description("RFQ leg."),
);
export type SubmitRfqLeg = v.InferOutput<typeof SubmitRfqLeg>;

/** Pre-signed request to submit an RFQ. */
export const SubmitRfqRequest = v.pipe(
  v.object({
    /** RFQ ID. */
    rfq_id: v.pipe(NonEmptyString, v.description("RFQ ID.")),
    /** Requested RFQ legs. */
    legs: v.pipe(v.array(SubmitRfqLeg), v.minLength(1), v.description("RFQ legs.")),
    /** Wallet performing the action. */
    wallet_address: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
    /** Optional auto-accept limit for `SubmitAutoExecuteRfq` signatures. */
    auto_accept_limit: v.pipe(
      v.optional(NonEmptyString),
      v.description("Auto-accept limit."),
    ),
  }),
  v.description("Pre-signed request to submit an RFQ."),
);
export type SubmitRfqRequest = v.InferOutput<typeof SubmitRfqRequest>;

/** Parameters for the {@linkcode submitRfq} function. */
export type SubmitRfqParameters = v.InferInput<typeof SubmitRfqRequest>;

/** Response for submitting an RFQ. */
export type SubmitRfqResponse = RfqStatusResponse;

/** Request options for the {@linkcode submitRfq} function. */
export type SubmitRfqOptions = ExchangeRequestOptions;

/**
 * Submit an RFQ using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `SubmitRFQ` or `SubmitAutoExecuteRfq` payload.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return RFQ status response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { submitRfq } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await submitRfq({ transport }, {
 *   rfq_id: "00000000-0000-0000-0000-000000000000",
 *   legs: [{ instrument: "BTC-30JUN26-100000-C", side: "Buy", size: "0.1" }],
 *   wallet_address: "0x0000000000000000000000000000000000000000",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function submitRfq(
  config: ExchangeConfig,
  params: SubmitRfqParameters,
  opts?: SubmitRfqOptions,
): Promise<SubmitRfqResponse> {
  const request = parse(SubmitRfqRequest, params);

  return config.transport.request<SubmitRfqResponse>(
    "/rfq/request",
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
