import * as v from "@valibot/valibot";

import { NonEmptyString, parse } from "../../_base.ts";
import type { Decimal, Side } from "./_base/_schemas.ts";
import type { InfoConfig } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request RFQ status by RFQ ID. */
export const RfqStatusRequest = v.pipe(
  v.object({
    /** RFQ ID. */
    rfqId: v.pipe(NonEmptyString, v.description("RFQ ID.")),
  }),
  v.description("Request RFQ status by RFQ ID."),
);
export type RfqStatusRequest = v.InferOutput<typeof RfqStatusRequest>;

/** Request parameters for the {@linkcode rfqStatus} function. */
export type RfqStatusParameters = v.InferInput<typeof RfqStatusRequest>;

/** RFQ lifecycle status. */
export type RfqStatus =
  | "created"
  | "sent_to_qps"
  | "quotes_received"
  | "no_quotes"
  | "expired"
  | "accepted"
  | "executed"
  | "failed";

/** RFQ leg in a status response. */
export type RfqLeg = {
  /** Instrument symbol. */
  instrument: string;
  /** Requested side. */
  side: Side;
  /** Requested size. */
  size: Decimal;
};

/** One quoted RFQ leg. */
export type RfqQuoteLeg = {
  /** Instrument symbol. */
  instrument: string;
  /** Quote side. */
  side: Side;
  /** Quote price. */
  price: Decimal;
  /** Quote size. */
  size: Decimal;
};

/** One quote returned for an RFQ. */
export type RfqQuote = {
  /** Quote ID. */
  quote_id: string;
  /** Net premium for the whole quote. */
  net_premium: Decimal;
  /** Per-leg quote details. */
  legs: RfqQuoteLeg[];
  /** Quote expiry timestamp in milliseconds since epoch. */
  expires_at: number;
};

/** RFQ status response. */
export type RfqStatusResponse = {
  /** RFQ ID. */
  rfq_id: string;
  /** Current RFQ status. */
  status: RfqStatus;
  /** RFQ underlying. */
  underlying: string;
  /** Requested RFQ legs. */
  legs: RfqLeg[];
  /** Quotes received for this RFQ. */
  quotes: RfqQuote[];
  /** RFQ creation timestamp in milliseconds since epoch. */
  created_at: number;
  /** RFQ expiry timestamp in milliseconds since epoch. */
  expires_at: number;
};

/**
 * Request RFQ status and quotes by RFQ ID.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return RFQ status response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { rfqStatus } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await rfqStatus({ transport }, {
 *   rfqId: "00000000-0000-0000-0000-000000000000",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function rfqStatus(
  config: InfoConfig,
  params: RfqStatusParameters,
  signal?: AbortSignal,
): Promise<RfqStatusResponse> {
  const request = parse(RfqStatusRequest, params);

  return config.transport.request<RfqStatusResponse>(
    `/rfq/${encodeURIComponent(request.rfqId)}`,
    {},
    signal,
  );
}
