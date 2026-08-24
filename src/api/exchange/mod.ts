/**
 * This module re-exports all exchange-related API request functions and types.
 *
 * Current exchange methods accept pre-signed request payloads. Signer-owned
 * convenience methods will be added after the EIP-712 helpers and nonce behavior
 * have parity tests.
 *
 * @module
 */

export type { ExchangeConfig, ExchangeRequestOptions } from "./_methods/_base/mod.ts";
export type {
  OrderRoute,
  OrderSide,
  OrderUpdateInfo,
  OrderUpdateMessage,
  OrderUpdateStatus,
  TimeInForce,
} from "./_methods/_base/order.ts";

export * from "./_methods/acceptRfqQuote.ts";
export * from "./_methods/approveAgent.ts";
export * from "./_methods/bulkCancelOrders.ts";
export * from "./_methods/bulkCancelOrdersByClientId.ts";
export * from "./_methods/cancelOrder.ts";
export * from "./_methods/cancelOrderByClientId.ts";
export * from "./_methods/createReferralCode.ts";
export * from "./_methods/placeOrder.ts";
export * from "./_methods/replaceOrder.ts";
export * from "./_methods/revokeAgent.ts";
export * from "./_methods/revokeAllAgents.ts";
export * from "./_methods/setReferrer.ts";
export * from "./_methods/setMarginMode.ts";
export * from "./_methods/setSettlementPayoutsSeen.ts";
export * from "./_methods/submitStandardMarginLiquidation.ts";
export * from "./_methods/submitRfq.ts";
export * from "./_methods/withdrawUsdc.ts";
