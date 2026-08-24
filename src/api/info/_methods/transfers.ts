import * as v from "@valibot/valibot";

import { NonEmptyString, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Decimal } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

export const TransferType = v.picklist(["deposit", "withdrawal", "internal_transfer"]);
export type TransferType = v.InferOutput<typeof TransferType>;

export const TransferStatus = v.picklist(["pending", "completed", "failed", "manual_review"]);
export type TransferStatus = v.InferOutput<typeof TransferStatus>;

/** Request unified transfer history. */
export const TransfersRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Wallet or manager address.")),
  transactionTypes: v.pipe(v.optional(v.array(TransferType)), v.description("Transaction type filters.")),
  assets: v.pipe(v.optional(v.array(NonEmptyString)), v.description("Asset filters.")),
  statuses: v.pipe(v.optional(v.array(TransferStatus)), v.description("Status filters.")),
  limit: v.pipe(v.optional(v.pipe(PositiveInteger, v.maxValue(100))), v.description("Limit.")),
  cursor: v.pipe(v.optional(NonEmptyString), v.description("Opaque pagination cursor.")),
});
export type TransfersRequest = v.InferOutput<typeof TransfersRequest>;
export type TransfersParameters = v.InferInput<typeof TransfersRequest>;

export type TransferHistoryEntry = {
  id: string;
  transaction_type: TransferType;
  subtype: string;
  asset_type: string;
  asset_symbol: string;
  amount: Decimal;
  status: TransferStatus;
  domain_status: string | null;
  delivery_status: string | null;
  tx_hash: string | null;
  tx_hash_type: "hyper_evm" | "hypercore";
  created_at: string;
};

export type TransferPage = {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
};

export type TransfersResponse = {
  success: boolean;
  data: TransferHistoryEntry[];
  page: TransferPage;
  error?: string | null;
};

/** Return unified deposit, withdrawal, and internal transfer history. */
export function transfers(
  config: InfoConfig,
  params: TransfersParameters,
  signal?: AbortSignal,
): Promise<TransfersResponse> {
  const request = parse(TransfersRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    transaction_type: request.transactionTypes?.join(","),
    asset: request.assets?.join(","),
    status: request.statuses?.join(","),
    limit: request.limit,
    cursor: request.cursor,
  });
  return config.transport.request<TransfersResponse>(`/v1/transfers?${query}`, {}, signal);
}
