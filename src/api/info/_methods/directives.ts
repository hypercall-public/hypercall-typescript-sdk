import * as v from "@valibot/valibot";

import { NonEmptyString, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

const WithdrawalHistoryLimit = v.pipe(
  PositiveInteger,
  v.maxValue(100, "Expected a limit of 100 or less."),
);

/** Request status for a directive by ID. */
export const DirectiveStatusRequest = v.pipe(
  v.object({
    /** Directive ID returned by a directive-producing endpoint. */
    directiveId: v.pipe(NonEmptyString, v.description("Directive ID.")),
  }),
  v.description("Request status for a directive by ID."),
);
export type DirectiveStatusRequest = v.InferOutput<typeof DirectiveStatusRequest>;

/** Request parameters for the {@linkcode directiveStatus} function. */
export type DirectiveStatusParameters = v.InferInput<typeof DirectiveStatusRequest>;

/** Request withdrawal history for a wallet. */
export const WithdrawalHistoryRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Maximum rows to return. Defaults to 50 on the API. */
    limit: v.pipe(v.optional(WithdrawalHistoryLimit), v.description("Limit.")),
  }),
  v.description("Request withdrawal history for a wallet."),
);
export type WithdrawalHistoryRequest = v.InferOutput<typeof WithdrawalHistoryRequest>;

/** Request parameters for the {@linkcode withdrawalHistory} function. */
export type WithdrawalHistoryParameters = v.InferInput<typeof WithdrawalHistoryRequest>;

/** Domain-level directive status. */
export type DirectiveDomainStatus =
  | "accepted"
  | "rejected"
  | "pending_chain_effect"
  | "completed"
  | "failed";

/** Directive delivery pipeline status. */
export type DirectiveDeliveryStatus =
  | "pending"
  | "broadcasted"
  | "included"
  | "finalized"
  | "reverted"
  | "expired"
  | "dead_lettered";

/** Directive delivery status lookup response. */
export type DirectiveStatusResponse = {
  /** Unique directive identifier. */
  directive_id: string;
  /** Action key, for example "system_withdraw_token". */
  action_key: string;
  /** Domain-level status. */
  domain_status: DirectiveDomainStatus;
  /** Delivery pipeline status. */
  delivery_status: DirectiveDeliveryStatus;
  /** On-chain transaction hash, if available. */
  tx_hash: string | null;
  /** Creation timestamp as ISO-8601 string, if available. */
  created_at: string | null;
};

/** Withdrawal history response. */
export type WithdrawalHistoryResponse = {
  /** Withdrawal directives, most recent first. */
  withdrawals: DirectiveStatusResponse[];
};

/**
 * Request status for a directive by ID.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Directive status response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { directiveStatus } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await directiveStatus({ transport }, {
 *   directiveId: "directive-id-from-withdrawal-response",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function directiveStatus(
  config: InfoConfig,
  params: DirectiveStatusParameters,
  signal?: AbortSignal,
): Promise<DirectiveStatusResponse> {
  const request = parse(DirectiveStatusRequest, params);

  return config.transport.request<DirectiveStatusResponse>(
    `/v1/directives/${encodeURIComponent(request.directiveId)}`,
    { cache: "no-store" },
    signal,
  );
}

/**
 * Request withdrawal history for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Withdrawal history response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { withdrawalHistory } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await withdrawalHistory({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   limit: 5,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function withdrawalHistory(
  config: InfoConfig,
  params: WithdrawalHistoryParameters,
  signal?: AbortSignal,
): Promise<WithdrawalHistoryResponse> {
  const request = parse(WithdrawalHistoryRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    limit: request.limit,
  });

  return config.transport.request<WithdrawalHistoryResponse>(
    `/v1/withdrawals?${query}`,
    { cache: "no-store" },
    signal,
  );
}
