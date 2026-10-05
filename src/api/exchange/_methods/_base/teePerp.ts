import * as v from "@valibot/valibot";

import { NonEmptyString, WalletAddress } from "../../../_base.ts";

// -------------------- Schemas --------------------

const U32_MAX = 4_294_967_295;
const U64_MAX = (1n << 64n) - 1n;
const U128_MAX = (1n << 128n) - 1n;

function uintString(label: string, max: bigint, nonZero: boolean) {
  return v.pipe(
    v.union([v.string(), v.pipe(v.number(), v.safeInteger(`Expected ${label} as a safe integer or decimal string`))]),
    v.transform((value) => String(value).trim()),
    v.regex(/^[0-9]+$/, `Expected ${label} as an unsigned decimal integer`),
    v.check((value) => BigInt(value) <= max, `Expected ${label} to fit its integer width`),
    v.check((value) => !nonZero || BigInt(value) > 0n, `Expected ${label} to be greater than zero`),
  );
}

/** Hyperliquid perp asset index (u32). */
export const TeePerpAsset = v.pipe(
  v.number(),
  v.integer("Expected an integer asset"),
  v.minValue(0, "Expected a non-negative asset"),
  v.maxValue(U32_MAX, "Expected a u32 asset"),
);

/** Positive 1e8-scaled u64 price or size. */
export const TeePerpUnits = uintString("a 1e8-scaled value", U64_MAX, true);

/** Non-zero decimal u128 client order id. */
export const TeePerpCloid = uintString("cloid", U128_MAX, true);

/** Signed millisecond nonce. Must be stamped on the server clock (see `TeePerpNonceManager`). */
export const TeePerpNonce = v.pipe(
  v.number(),
  v.safeInteger("Expected a safe integer nonce"),
  v.minValue(1, "Expected a positive nonce"),
);

/** Hypercall's TIF byte: 1 = ALO, 2 = GTC, 3 = IOC. */
export const EncodedPerpTifSchema = v.picklist([1, 2, 3]);

/** Trigger direction. */
export const TeePerpTpslSchema = v.picklist(["tp", "sl"]);

/** Native batch grouping. */
export const TeePerpOrderGroupingSchema = v.picklist(["na", "normalTpsl", "positionTpsl"]);

/** One plain limit order (`HlLimitOrderAction`). */
export const HlLimitOrderActionSchema = v.object({
  asset: TeePerpAsset,
  isBuy: v.boolean(),
  limitPx: TeePerpUnits,
  sz: TeePerpUnits,
  reduceOnly: v.boolean(),
  encodedTif: EncodedPerpTifSchema,
  cloid: TeePerpCloid,
});

/** Exactly one of `limit` or `trigger`. */
export const TeePerpOrderTypeWireSchema = v.union([
  v.strictObject({ limit: v.object({ encodedTif: EncodedPerpTifSchema }) }),
  v.strictObject({
    trigger: v.object({ triggerPx: TeePerpUnits, isMarket: v.boolean(), tpsl: TeePerpTpslSchema }),
  }),
]);

/** One native order for the trigger and batch routes. */
export const TeePerpOrderWireSchema = v.object({
  asset: TeePerpAsset,
  isBuy: v.boolean(),
  limitPx: TeePerpUnits,
  sz: TeePerpUnits,
  reduceOnly: v.boolean(),
  orderType: TeePerpOrderTypeWireSchema,
  cloid: TeePerpCloid,
});

/** Common fields of every app-key-signed TEE perp request. */
export const teePerpSignedFields = {
  /** Account.sol address that trades. */
  account: v.pipe(WalletAddress, v.description("Account.sol address.")),
  /** Server-clock millisecond nonce used in the EIP-712 signature. */
  nonce: v.pipe(TeePerpNonce, v.description("Signature nonce.")),
  /** API wallet (app key) EIP-712 signature. */
  signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
};

// -------------------- Response Types --------------------

/** Outcome of a same-call TEE submission. Only `accepted` means the venue accepted it. */
export type TeePerpOrderStage = "accepted" | "rejected" | "not_submitted" | "unknown";

/** Every stable TEE perp failure classification the server returns. */
export const TEE_PERP_ERROR_CODES = [
  "engine_admission_rejected",
  "duplicate_directive",
  "trading_unavailable",
  "execution_unavailable",
  "authorization_failed",
  "invalid_request",
  "wallet_not_admitted",
  "wallet_admission_mismatch",
  "wallet_admission_unavailable",
  "parent_credentials_unavailable",
  "parent_kms_request_invalid",
  "enclave_unavailable",
  "enclave_kms_request_invalid",
  "enclave_wallet_unavailable",
  "enclave_clock_unavailable",
  "enclave_policy_rejected",
  "enclave_authorization_rejected",
  "enclave_wallet_mismatch",
  "enclave_intent_expired",
  "enclave_intent_ttl_exceeded",
  "enclave_signing_failed",
  "enclave_attestation_failed",
  "enclave_response_invalid",
  "parent_response_invalid",
  "signed_request_invalid",
  "internal_unavailable",
  "venue_rejected",
  "builder_not_approved",
  "submission_outcome_unknown",
] as const;
/** Stable, non-sensitive TEE perp failure classification. */
export type TeePerpErrorCode = typeof TEE_PERP_ERROR_CODES[number];

/** Every stable perp rejection reason code. Preview and submit return the same code for the same rejection. */
export const PERP_REJECTION_REASON_CODES = [
  "insufficient_margin",
  "mode_change_with_position",
  "stale_position_snapshot",
  "market_not_supported",
  "unified_mode_required",
  "reduce_only_exceeds_position",
  "trading_halted",
  "account_not_pm",
  "venue_risk_unavailable",
  "price_unavailable",
  "liquidation_pending",
  "account_health_unavailable",
  "leverage_requires_flat_account",
  "action_not_supported",
  "invalid_order",
  "engine_rejected",
] as const;
/** Stable machine code for why a perp action is (or would be) rejected. */
export type PerpRejectionReasonCode = typeof PERP_REJECTION_REASON_CODES[number];

/** WAL offset. The API sends a JSON number when it is a safe integer, otherwise a decimal string. */
export type EngineSeq = number | string;

/** Response of `POST /v1/tee-perp/orders/submit`. */
export type TeePerpOrderResponse = {
  stage: TeePerpOrderStage;
  errorCode: TeePerpErrorCode | null;
  directiveId: string;
  account: string;
  apiWallet: string;
  /** Cloid as 0x-prefixed 16-byte hex. */
  cloid: string;
  /** WAL offset for a newly committed directive. Exact retries return null. */
  engineSeq: EngineSeq | null;
  venueResponseHash: string | null;
  message: string | null;
  reasonCode: PerpRejectionReasonCode | null;
};

/** Response of `POST /v1/tee-perp/cancels/submit`. */
export type TeePerpCancelResponse = {
  stage: TeePerpOrderStage;
  errorCode: TeePerpErrorCode | null;
  directiveId: string;
  account: string;
  apiWallet: string;
  cloid: string;
  engineSeq: EngineSeq | null;
  venueResponseHash: string | null;
  message: string | null;
};

/** Response of `POST /v1/tee-perp/cancels/submit-by-oid`. */
export type TeePerpVenueActionResponse = {
  stage: TeePerpOrderStage;
  errorCode: TeePerpErrorCode | null;
  requestId: string;
  account: string;
  apiWallet: string;
  actionKind: string;
  engineSeq: EngineSeq | null;
  venueResponseHash: string | null;
  message: string | null;
};

/** One child of a batch response. */
export type TeePerpOrderBatchChildResponse = {
  /** Engine reservation identity of this child. */
  directiveId: string;
  /** The child's cloid as 0x-prefixed 16-byte hex. */
  cloid: string;
};

/** Response of `POST /v1/tee-perp/orders/submit-trigger` and `/orders/submit-batch`. */
export type TeePerpOrderBatchResponse = {
  /** `accepted` only when every child was accepted. A partly rejected batch is `unknown`. */
  stage: TeePerpOrderStage;
  errorCode: TeePerpErrorCode | null;
  batchId: string;
  account: string;
  apiWallet: string;
  grouping: v.InferOutput<typeof TeePerpOrderGroupingSchema>;
  /** Children in submission order. */
  children: TeePerpOrderBatchChildResponse[];
  engineSeq: EngineSeq | null;
  venueResponseHash: string | null;
  message: string | null;
  reasonCode: PerpRejectionReasonCode | null;
};

/** Response of `POST /v1/tee-perp/leverage/submit`. */
export type TeePerpLeverageResponse = {
  stage: TeePerpOrderStage;
  errorCode: TeePerpErrorCode | null;
  requestId: string;
  account: string;
  apiWallet: string;
  asset: number;
  isCross: boolean;
  leverage: number;
  engineSeq: EngineSeq | null;
  venueResponseHash: string | null;
  message: string | null;
  reasonCode: PerpRejectionReasonCode | null;
};

/** Any TEE perp submit response. */
export type AnyTeePerpResponse =
  | TeePerpOrderResponse
  | TeePerpCancelResponse
  | TeePerpVenueActionResponse
  | TeePerpOrderBatchResponse
  | TeePerpLeverageResponse;

/** Whether the venue rejected the order because the account has not approved the Hypercall builder. */
export function isBuilderNotApproved(response: Pick<AnyTeePerpResponse, "errorCode">): boolean {
  return response.errorCode === "builder_not_approved";
}
