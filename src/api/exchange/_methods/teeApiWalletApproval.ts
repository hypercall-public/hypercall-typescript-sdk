import * as v from "@valibot/valibot";

import { NonEmptyString, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { ExchangeConfig, ExchangeRequestOptions } from "./_base/mod.ts";

// -------------------- Schemas --------------------

const ManagerAuthenticationFields = {
  /** Account.sol address whose manager authorizes the TEE API wallet. */
  account: v.pipe(WalletAddress, v.description("Account.sol address.")),
  /** Current manager of the portfolio-margin account. */
  manager: v.pipe(WalletAddress, v.description("Account manager wallet.")),
  /** Unix seconds included in the EIP-191 authentication message. */
  timestamp: v.pipe(PositiveInteger, v.description("Authentication timestamp in seconds.")),
};

/** Request to allocate the account's TEE API wallet and receive its approval payload. */
export const TeeApiWalletApprovalRequestRequest = v.pipe(
  v.object({
    ...ManagerAuthenticationFields,
    /** EIP-191 manager signature over `buildHypercallAuthenticationMessage(timestamp)`. */
    signature: v.pipe(NonEmptyString, v.description("Manager authentication signature.")),
  }),
  v.description("Request a TEE API wallet approval payload."),
);
export type TeeApiWalletApprovalRequestRequest = v.InferOutput<typeof TeeApiWalletApprovalRequestRequest>;

/** Parameters for the {@linkcode teeApiWalletApprovalRequest} function. */
export type TeeApiWalletApprovalRequestParameters = v.InferInput<typeof TeeApiWalletApprovalRequestRequest>;

/** EIP-712 payload returned by the server for the manager to sign. */
export type TeeApiWalletApprovalTypedData = {
  domain: { name: string; version: string; chainId: number; verifyingContract: string };
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  message: {
    account: string;
    nonce: number | string;
    action: { apiWalletAddress: string; apiWalletName: string };
  };
};

/** TEE API wallet identity and the approval payload the manager signs. */
export type TeeApiWalletApprovalRequestResponse = {
  /** Opaque TEE wallet identity. Echo it when submitting the signature. */
  teeWalletId: string;
  /** Hyperliquid API wallet address controlled by the TEE. */
  apiWalletAddress: string;
  /** Stable name registered for the API wallet on Hyperliquid. */
  apiWalletName: string;
  /** Nonce included in the EIP-712 payload. Copy it without modification. */
  nonce: number | string;
  /** Server issuance time encoded into `nonce`, as Unix milliseconds. */
  issuedAtMs: number;
  /** Last Unix millisecond at which the signed approval may be submitted. */
  expiresAtMs: number;
  /** `HLAddApiWallet` typed data in the `HypercallManagerSign` domain. */
  typedData: TeeApiWalletApprovalTypedData;
};

/** Request options for the {@linkcode teeApiWalletApprovalRequest} function. */
export type TeeApiWalletApprovalRequestOptions = ExchangeRequestOptions;

/**
 * Allocate (or return) the account's TEE API wallet and its `HLAddApiWallet` approval payload.
 *
 * Signing: EIP-191 manager authentication over
 * `Sign this message to authenticate for Hypercall\nTimestamp: <seconds>`.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Manager-authenticated parameters.
 * @param opts Request execution options.
 * @return TEE wallet identity and typed data.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { teeApiWalletApprovalRequest } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teeApiWalletApprovalRequest({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   manager: "0x0000000000000000000000000000000000000000",
 *   timestamp: 1785672000,
 *   signature: "0x...",
 * });
 * ```
 */
export function teeApiWalletApprovalRequest(
  config: ExchangeConfig,
  params: TeeApiWalletApprovalRequestParameters,
  opts?: TeeApiWalletApprovalRequestOptions,
): Promise<TeeApiWalletApprovalRequestResponse> {
  const request = parse(TeeApiWalletApprovalRequestRequest, params);

  return config.transport.request<TeeApiWalletApprovalRequestResponse>(
    "/v1/tee-api-wallet/approval-request",
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

/** Submit the manager-signed TEE API wallet approval. */
export const TeeApiWalletApprovalSubmitRequest = v.pipe(
  v.object({
    ...ManagerAuthenticationFields,
    /** EIP-191 manager authentication signature. */
    authenticationSignature: v.pipe(NonEmptyString, v.description("Manager authentication signature.")),
    /** `teeWalletId` from the approval request. */
    teeWalletId: v.pipe(v.string(), v.regex(/^0x[0-9a-fA-F]{64}$/, "Expected a 32-byte hex teeWalletId")),
    /** Nonce from the approval request, unchanged. */
    nonce: v.pipe(
      v.union([v.pipe(v.string(), v.regex(/^[0-9]+$/, "Expected a decimal nonce")), v.number()]),
      v.description("Approval nonce."),
    ),
    /** Manager EIP-712 signature over the returned typed data. */
    signature: v.pipe(NonEmptyString, v.description("Manager EIP-712 signature.")),
  }),
  v.description("Submit a manager-signed TEE API wallet approval."),
);
export type TeeApiWalletApprovalSubmitRequest = v.InferOutput<typeof TeeApiWalletApprovalSubmitRequest>;

/** Parameters for the {@linkcode teeApiWalletApprovalSubmit} function. */
export type TeeApiWalletApprovalSubmitParameters = v.InferInput<typeof TeeApiWalletApprovalSubmitRequest>;

/** Directive submit response. Poll `directiveId` with `directiveStatus` until finalized. */
export type TeeApiWalletApprovalSubmitResponse = {
  stage: "rejected" | "enqueued" | "submitted";
  directiveId: string;
  actionKey: string;
  account: string;
  nonce: number | string;
  recoveredSigner: string | null;
  txHash: string | null;
  rejection: { code?: string; message?: string } | null;
  fills: unknown;
};

/** Request options for the {@linkcode teeApiWalletApprovalSubmit} function. */
export type TeeApiWalletApprovalSubmitOptions = ExchangeRequestOptions;

/**
 * Submit the manager's signature over the `HLAddApiWallet` payload. The server rebuilds the
 * approval from its own TEE record, so only the identity, nonce, and signature are sent.
 * The response is a directive; poll it with `directiveStatus` and `teeApiWalletApprovalProgress`.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Manager-signed parameters.
 * @param opts Request execution options.
 * @return Directive submit response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { teeApiWalletApprovalSubmit } from "@hypercallxyz/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await teeApiWalletApprovalSubmit({ transport }, {
 *   account: "0x0000000000000000000000000000000000000000",
 *   manager: "0x0000000000000000000000000000000000000000",
 *   timestamp: 1785672000,
 *   authenticationSignature: "0x...",
 *   teeWalletId: "0x2222222222222222222222222222222222222222222222222222222222222222",
 *   nonce: "117025488076800007",
 *   signature: "0x...",
 * });
 * ```
 */
export function teeApiWalletApprovalSubmit(
  config: ExchangeConfig,
  params: TeeApiWalletApprovalSubmitParameters,
  opts?: TeeApiWalletApprovalSubmitOptions,
): Promise<TeeApiWalletApprovalSubmitResponse> {
  const request = parse(TeeApiWalletApprovalSubmitRequest, params);

  return config.transport.request<TeeApiWalletApprovalSubmitResponse>(
    "/v1/tee-api-wallet/approval",
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

/** Progress of a TEE API wallet approval directive. */
export type TeeApiWalletApprovalProgress = "pending" | "finalized" | "failed";

const FAILED_DOMAIN_STATUSES = new Set(["failed", "rejected"]);
const FAILED_DELIVERY_STATUSES = new Set(["core_rejected", "reverted", "expired", "dead_lettered"]);

/** Classify a `directiveStatus` result for the approval directive. */
export function teeApiWalletApprovalProgress(
  status: { domain_status: string; delivery_status: string },
): TeeApiWalletApprovalProgress {
  if (status.domain_status === "completed" && status.delivery_status === "finalized") return "finalized";
  if (FAILED_DOMAIN_STATUSES.has(status.domain_status) || FAILED_DELIVERY_STATUSES.has(status.delivery_status)) {
    return "failed";
  }
  return "pending";
}
