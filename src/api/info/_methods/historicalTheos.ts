import * as v from "@valibot/valibot";

import { NonEmptyString, parse, PositiveInteger } from "../../_base.ts";
import type { ApiResponse } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

const HistoricalTheoIntervalSchema = v.pipe(
  v.picklist(["5m", "1h", "1d"]),
  v.description("Historical theoretical-price interval."),
);

const HistoricalTheoLimit = v.pipe(
  PositiveInteger,
  v.maxValue(100, "Expected a limit of 100 or less."),
);

/** Request historical theoretical prices for an option instrument. */
export const HistoricalTheosRequest = v.pipe(
  v.object({
    /** Option instrument symbol. */
    instrumentName: v.pipe(NonEmptyString, v.description("Option instrument symbol.")),
    /** Interval bucket size. */
    interval: HistoricalTheoIntervalSchema,
    /** Maximum number of periods to return. Defaults to 100 on the API. */
    limit: v.pipe(v.optional(HistoricalTheoLimit), v.description("Limit.")),
  }),
  v.description("Request historical theoretical prices for an option instrument."),
);
export type HistoricalTheosRequest = v.InferOutput<typeof HistoricalTheosRequest>;

/** Request parameters for the {@linkcode historicalTheos} function. */
export type HistoricalTheosParameters = v.InferInput<typeof HistoricalTheosRequest>;

/** Request historical theoretical prices for multiple option instruments. */
export const HistoricalTheosBatchRequest = v.pipe(
  v.object({
    /** Option instrument symbols. */
    instrumentNames: v.pipe(
      v.array(NonEmptyString),
      v.minLength(1, "Expected at least one instrument name."),
      v.maxLength(50, "Expected 50 or fewer instrument names."),
      v.description("Option instrument symbols."),
    ),
    /** Interval bucket size. */
    interval: HistoricalTheoIntervalSchema,
    /** Maximum number of periods per instrument. Defaults to 100 on the API. */
    limit: v.pipe(v.optional(HistoricalTheoLimit), v.description("Limit.")),
  }),
  v.description("Request historical theoretical prices for multiple option instruments."),
);
export type HistoricalTheosBatchRequest = v.InferOutput<typeof HistoricalTheosBatchRequest>;

/** Request parameters for the {@linkcode historicalTheosBatch} function. */
export type HistoricalTheosBatchParameters = v.InferInput<typeof HistoricalTheosBatchRequest>;

/** Supported historical theoretical-price snapshot intervals. */
export type HistoricalTheoInterval = v.InferOutput<typeof HistoricalTheoIntervalSchema>;

/** A single historical theoretical-price point. */
export type HistoricalTheoPoint = {
  /** Interval bucket start timestamp in milliseconds since epoch. */
  timestamp: number;
  /** Theoretical option price at the bucket timestamp. */
  theoretical_price: number;
};

/** Historical theoretical-price data for an option instrument and interval. */
export type HistoricalTheoData = {
  /** Option instrument symbol. */
  instrument_name: string;
  /** Historical interval identifier. */
  interval: HistoricalTheoInterval;
  /** Returned points in ascending timestamp order. */
  points: HistoricalTheoPoint[];
};

/** Historical theoretical-price response. */
export type HistoricalTheosResponse = ApiResponse<HistoricalTheoData>;

/** Batch historical theoretical-price response keyed by requested instrument symbol. */
export type HistoricalTheosBatchResponse = ApiResponse<Record<string, HistoricalTheoData>>;

/**
 * Request historical theoretical prices for an option instrument.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Historical theoretical-price response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { historicalTheos } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await historicalTheos({ transport }, {
 *   instrumentName: "SPCX-20261231-10-C",
 *   interval: "1h",
 *   limit: 48,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function historicalTheos(
  config: InfoConfig,
  params: HistoricalTheosParameters,
  signal?: AbortSignal,
): Promise<HistoricalTheosResponse> {
  const request = parse(HistoricalTheosRequest, params);
  const query = toQuery({
    instrument_name: request.instrumentName,
    interval: request.interval,
    limit: request.limit,
  });

  return config.transport.request<HistoricalTheosResponse>(`/historical-theos?${query}`, {}, signal);
}

/**
 * Request historical theoretical prices for multiple option instruments.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Batch historical theoretical-price response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { historicalTheosBatch } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await historicalTheosBatch({ transport }, {
 *   instrumentNames: ["SPCX-20261231-10-C", "SPCX-20261231-12-C"],
 *   interval: "1h",
 *   limit: 48,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function historicalTheosBatch(
  config: InfoConfig,
  params: HistoricalTheosBatchParameters,
  signal?: AbortSignal,
): Promise<HistoricalTheosBatchResponse> {
  const request = parse(HistoricalTheosBatchRequest, params);
  const query = toQuery({
    instrument_names: request.instrumentNames.join(","),
    interval: request.interval,
    limit: request.limit,
  });

  return config.transport.request<HistoricalTheosBatchResponse>(`/historical-theos/batch?${query}`, {}, signal);
}
