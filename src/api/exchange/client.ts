/**
 * Client for the Hypercall Exchange API.
 * @module
 */

import type { ExchangeConfig } from "./_methods/_base/mod.ts";
import {
  acceptRfqQuote,
  type AcceptRfqQuoteOptions,
  type AcceptRfqQuoteParameters,
  type AcceptRfqQuoteResponse,
} from "./_methods/acceptRfqQuote.ts";
import {
  approveAgent,
  type ApproveAgentOptions,
  type ApproveAgentParameters,
  type ApproveAgentResponse,
} from "./_methods/approveAgent.ts";
import {
  bulkCancelOrders,
  type BulkCancelOrdersOptions,
  type BulkCancelOrdersParameters,
  type BulkCancelOrdersResponse,
} from "./_methods/bulkCancelOrders.ts";
import {
  bulkCancelOrdersByClientId,
  type BulkCancelOrdersByClientIdOptions,
  type BulkCancelOrdersByClientIdParameters,
  type BulkCancelOrdersByClientIdResponse,
} from "./_methods/bulkCancelOrdersByClientId.ts";
import {
  cancelOrder,
  type CancelOrderOptions,
  type CancelOrderParameters,
  type CancelOrderResponse,
} from "./_methods/cancelOrder.ts";
import {
  cancelOrderByClientId,
  type CancelOrderByClientIdOptions,
  type CancelOrderByClientIdParameters,
  type CancelOrderByClientIdResponse,
} from "./_methods/cancelOrderByClientId.ts";
import {
  createReferralCode,
  type CreateReferralCodeOptions,
  type CreateReferralCodeParameters,
  type CreateReferralCodeResponse,
} from "./_methods/createReferralCode.ts";
import {
  placeOrder,
  type PlaceOrderOptions,
  type PlaceOrderParameters,
  type PlaceOrderResponse,
} from "./_methods/placeOrder.ts";
import {
  replaceOrder,
  type ReplaceOrderOptions,
  type ReplaceOrderParameters,
  type ReplaceOrderResponse,
} from "./_methods/replaceOrder.ts";
import {
  revokeAgent,
  type RevokeAgentOptions,
  type RevokeAgentParameters,
  type RevokeAgentResponse,
} from "./_methods/revokeAgent.ts";
import {
  revokeAllAgents,
  type RevokeAllAgentsOptions,
  type RevokeAllAgentsParameters,
  type RevokeAllAgentsResponse,
} from "./_methods/revokeAllAgents.ts";
import {
  setReferrer,
  type SetReferrerOptions,
  type SetReferrerParameters,
  type SetReferrerResponse,
} from "./_methods/setReferrer.ts";
import {
  setMarginMode,
  type SetMarginModeOptions,
  type SetMarginModeParameters,
  type SetMarginModeResponse,
} from "./_methods/setMarginMode.ts";
import {
  setSettlementPayoutsSeen,
  type SetSettlementPayoutsSeenOptions,
  type SetSettlementPayoutsSeenParameters,
  type SetSettlementPayoutsSeenResponse,
} from "./_methods/setSettlementPayoutsSeen.ts";
import {
  submitStandardMarginLiquidation,
  type SubmitStandardMarginLiquidationOptions,
  type SubmitStandardMarginLiquidationParameters,
  type SubmitStandardMarginLiquidationResponse,
} from "./_methods/submitStandardMarginLiquidation.ts";
import {
  submitRfq,
  type SubmitRfqOptions,
  type SubmitRfqParameters,
  type SubmitRfqResponse,
} from "./_methods/submitRfq.ts";
import {
  withdrawUsdc,
  type WithdrawUsdcOptions,
  type WithdrawUsdcParameters,
  type WithdrawUsdcResponse,
} from "./_methods/withdrawUsdc.ts";
import {
  teeApiWalletApprovalRequest,
  type TeeApiWalletApprovalRequestOptions,
  type TeeApiWalletApprovalRequestParameters,
  type TeeApiWalletApprovalRequestResponse,
  teeApiWalletApprovalSubmit,
  type TeeApiWalletApprovalSubmitOptions,
  type TeeApiWalletApprovalSubmitParameters,
  type TeeApiWalletApprovalSubmitResponse,
} from "./_methods/teeApiWalletApproval.ts";
import {
  teePerpCancelByCloid,
  type TeePerpCancelByCloidOptions,
  type TeePerpCancelByCloidParameters,
  type TeePerpCancelByCloidResponse,
} from "./_methods/teePerpCancelByCloid.ts";
import {
  teePerpCancelByOid,
  type TeePerpCancelByOidOptions,
  type TeePerpCancelByOidParameters,
  type TeePerpCancelByOidResponse,
} from "./_methods/teePerpCancelByOid.ts";
import {
  teePerpSubmitOrder,
  type TeePerpSubmitOrderOptions,
  type TeePerpSubmitOrderParameters,
  type TeePerpSubmitOrderResponse,
} from "./_methods/teePerpSubmitOrder.ts";
import {
  teePerpSubmitOrderBatch,
  type TeePerpSubmitOrderBatchOptions,
  type TeePerpSubmitOrderBatchParameters,
  type TeePerpSubmitOrderBatchResponse,
} from "./_methods/teePerpSubmitOrderBatch.ts";
import {
  teePerpSubmitTriggerOrder,
  type TeePerpSubmitTriggerOrderOptions,
  type TeePerpSubmitTriggerOrderParameters,
  type TeePerpSubmitTriggerOrderResponse,
} from "./_methods/teePerpSubmitTriggerOrder.ts";
import {
  teePerpUpdateLeverage,
  type TeePerpUpdateLeverageOptions,
  type TeePerpUpdateLeverageParameters,
  type TeePerpUpdateLeverageResponse,
} from "./_methods/teePerpUpdateLeverage.ts";

/** A client for interacting with signed Hypercall Exchange API methods. */
export class ExchangeClient<C extends ExchangeConfig = ExchangeConfig> {
  config_: C;

  constructor(config: C) {
    this.config_ = config;
  }

  /**
   * Approve an agent wallet using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `ApproveAgent` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Agent approval response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.approveAgent({
   *   agent: "0x0000000000000000000000000000000000000000",
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  approveAgent(params: ApproveAgentParameters, opts?: ApproveAgentOptions): Promise<ApproveAgentResponse> {
    return approveAgent(this.config_, params, opts);
  }

  /**
   * Cancel an order by order ID using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `CancelOrder` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Cancel order response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.cancelOrder({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   order_id: 123,
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  cancelOrder(params: CancelOrderParameters, opts?: CancelOrderOptions): Promise<CancelOrderResponse> {
    return cancelOrder(this.config_, params, opts);
  }

  /**
   * Cancel an order by client ID using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `CancelOrderByClientId` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Cancel order response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.cancelOrderByClientId({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   client_id: "0x...",
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  cancelOrderByClientId(
    params: CancelOrderByClientIdParameters,
    opts?: CancelOrderByClientIdOptions,
  ): Promise<CancelOrderByClientIdResponse> {
    return cancelOrderByClientId(this.config_, params, opts);
  }

  /**
   * Cancel multiple orders by order ID using pre-signed Hypercall EIP-712 payloads.
   *
   * Signing: pre-signed EIP-712 `CancelOrder` payloads.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Bulk cancel response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.bulkCancelOrders({
   *   cancels: [{
   *     wallet: "0x0000000000000000000000000000000000000000",
   *     order_id: 123,
   *     nonce: 1,
   *     signature: "0x...",
   *   }],
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  bulkCancelOrders(
    params: BulkCancelOrdersParameters,
    opts?: BulkCancelOrdersOptions,
  ): Promise<BulkCancelOrdersResponse> {
    return bulkCancelOrders(this.config_, params, opts);
  }

  /**
   * Cancel multiple orders by client ID using pre-signed Hypercall EIP-712 payloads.
   *
   * Signing: pre-signed EIP-712 `CancelOrderByClientId` payloads.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Bulk cancel response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.bulkCancelOrdersByClientId({
   *   cancels: [{
   *     wallet: "0x0000000000000000000000000000000000000000",
   *     client_id: "client-123",
   *     nonce: 1,
   *     signature: "0x...",
   *   }],
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  bulkCancelOrdersByClientId(
    params: BulkCancelOrdersByClientIdParameters,
    opts?: BulkCancelOrdersByClientIdOptions,
  ): Promise<BulkCancelOrdersByClientIdResponse> {
    return bulkCancelOrdersByClientId(this.config_, params, opts);
  }

  /**
   * Place an order using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `PlaceOrder` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Order update response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.placeOrder({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   symbol: "BTC-30JUN26-100000-C",
   *   side: "Buy",
   *   size: "0.1",
   *   price: "100",
   *   tif: "gtc",
   *   route: "best_execution",
   *   client_id: "client-123",
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  placeOrder(params: PlaceOrderParameters, opts?: PlaceOrderOptions): Promise<PlaceOrderResponse> {
    return placeOrder(this.config_, params, opts);
  }

  /**
   * Replace an order using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `ReplaceOrder` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Order update response for the replacement.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.replaceOrder({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   order_id: 123,
   *   symbol: "BTC-30JUN26-100000-C",
   *   side: "Buy",
   *   size: "0.1",
   *   price: "101",
   *   tif: "gtc",
   *   client_id: "client-124",
   *   nonce: 2,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  replaceOrder(params: ReplaceOrderParameters, opts?: ReplaceOrderOptions): Promise<ReplaceOrderResponse> {
    return replaceOrder(this.config_, params, opts);
  }

  /**
   * Set account margin mode using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `SetMarginMode` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Margin mode update response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.setMarginMode({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   margin_mode: "standard",
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  setMarginMode(params: SetMarginModeParameters, opts?: SetMarginModeOptions): Promise<SetMarginModeResponse> {
    return setMarginMode(this.config_, params, opts);
  }

  /**
   * Revoke an agent wallet using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `RevokeAgent` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Agent revocation response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.revokeAgent({
   *   agent: "0x0000000000000000000000000000000000000000",
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  revokeAgent(params: RevokeAgentParameters, opts?: RevokeAgentOptions): Promise<RevokeAgentResponse> {
    return revokeAgent(this.config_, params, opts);
  }

  /**
   * Mark settlement payouts as seen using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Settlement payout seen mutation response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.setSettlementPayoutsSeen({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   ids: [123],
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  setSettlementPayoutsSeen(
    params: SetSettlementPayoutsSeenParameters,
    opts?: SetSettlementPayoutsSeenOptions,
  ): Promise<SetSettlementPayoutsSeenResponse> {
    return setSettlementPayoutsSeen(this.config_, params, opts);
  }

  /**
   * Withdraw USDC from Hypercall to Hyperliquid using an owner-signed payload.
   *
   * Signing: pre-signed EIP-712 `WithdrawUsdc` payload. The backend rejects
   * authorized-agent signatures for this endpoint.
   *
   * @param params Owner-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return USDC withdrawal submit response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.withdrawUsdc({
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
  withdrawUsdc(params: WithdrawUsdcParameters, opts?: WithdrawUsdcOptions): Promise<WithdrawUsdcResponse> {
    return withdrawUsdc(this.config_, params, opts);
  }

  /**
   * Submit an RFQ using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `SubmitRFQ` or `SubmitAutoExecuteRfq` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return RFQ status response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.submitRfq({
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
  submitRfq(params: SubmitRfqParameters, opts?: SubmitRfqOptions): Promise<SubmitRfqResponse> {
    return submitRfq(this.config_, params, opts);
  }

  /**
   * Accept an RFQ quote using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `AcceptRFQQuote` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return RFQ accept response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.acceptRfqQuote({
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
  acceptRfqQuote(
    params: AcceptRfqQuoteParameters,
    opts?: AcceptRfqQuoteOptions,
  ): Promise<AcceptRfqQuoteResponse> {
    return acceptRfqQuote(this.config_, params, opts);
  }

  /**
   * Submit a standard-margin liquidation bid using a pre-signed Hypercall EIP-712 payload.
   *
   * Signing: pre-signed EIP-712 `StandardMarginLiquidationOrder` payload.
   *
   * @param params Pre-signed parameters specific to the API request.
   * @param opts Request execution options.
   * @return Standard-margin liquidation submit response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { ExchangeClient, HttpTransport } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new ExchangeClient({ transport });
   *
   * const data = await client.submitStandardMarginLiquidation({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   liquidated_wallet: "0x1111111111111111111111111111111111111111",
   *   request_id: "00000000-0000-0000-0000-000000000000",
   *   auction_id: "auction-1",
   *   bid_usdc: "100",
   *   positions: [{ symbol: "BTC-30JUN26-100000-C", quantity: "1", entry_price: "10" }],
   *   portfolio_hash: "0xportfolio",
   *   auction_terms_hash: "0xterms",
   *   auction_version: 1,
   *   valuation_timestamp_ms: 1,
   *   bid_intent_hash: "intent-1",
   *   nonce: 1,
   *   signature: "0x...",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  submitStandardMarginLiquidation(
    params: SubmitStandardMarginLiquidationParameters,
    opts?: SubmitStandardMarginLiquidationOptions,
  ): Promise<SubmitStandardMarginLiquidationResponse> {
    return submitStandardMarginLiquidation(this.config_, params, opts);
  }

  /** Revoke every authorized agent using a pre-signed payload. */
  revokeAllAgents(
    params: RevokeAllAgentsParameters,
    opts?: RevokeAllAgentsOptions,
  ): Promise<RevokeAllAgentsResponse> {
    return revokeAllAgents(this.config_, params, opts);
  }

  /** Create an account's permanent referral code. */
  createReferralCode(
    params: CreateReferralCodeParameters,
    opts?: CreateReferralCodeOptions,
  ): Promise<CreateReferralCodeResponse> {
    return createReferralCode(this.config_, params, opts);
  }

  /** Permanently set an account's referrer. */
  setReferrer(params: SetReferrerParameters, opts?: SetReferrerOptions): Promise<SetReferrerResponse> {
    return setReferrer(this.config_, params, opts);
  }

  /**
   * Submit one API-wallet-signed limit order (GTC, IOC, ALO) to `POST /v1/tee-perp/orders/submit`.
   *
   * Signing: pre-signed EIP-712 `HLOrder` payload in the `HypercallApiSign` domain
   * (`buildTeePerpLimitOrderTypedData`), nonce stamped on the server clock.
   */
  teePerpSubmitOrder(
    params: TeePerpSubmitOrderParameters,
    opts?: TeePerpSubmitOrderOptions,
  ): Promise<TeePerpSubmitOrderResponse> {
    return teePerpSubmitOrder(this.config_, params, opts);
  }

  /**
   * Submit one native stop or take-profit order to `POST /v1/tee-perp/orders/submit-trigger`.
   *
   * Signing: pre-signed EIP-712 `HCPerpTriggerOrder` payload (`buildTeePerpTriggerOrderTypedData`).
   */
  teePerpSubmitTriggerOrder(
    params: TeePerpSubmitTriggerOrderParameters,
    opts?: TeePerpSubmitTriggerOrderOptions,
  ): Promise<TeePerpSubmitTriggerOrderResponse> {
    return teePerpSubmitTriggerOrder(this.config_, params, opts);
  }

  /**
   * Submit a native order batch (scale, `normalTpsl` bracket, `positionTpsl`) to
   * `POST /v1/tee-perp/orders/submit-batch`.
   *
   * Signing: pre-signed EIP-712 `HCPerpOrderBatch` payload (`buildTeePerpOrderBatchTypedData`).
   */
  teePerpSubmitOrderBatch(
    params: TeePerpSubmitOrderBatchParameters,
    opts?: TeePerpSubmitOrderBatchOptions,
  ): Promise<TeePerpSubmitOrderBatchResponse> {
    return teePerpSubmitOrderBatch(this.config_, params, opts);
  }

  /**
   * Cancel a TEE perp order by cloid (`POST /v1/tee-perp/cancels/submit`).
   *
   * Signing: pre-signed EIP-712 `HLCancelByCloid` payload (`buildTeePerpCancelByCloidTypedData`).
   */
  teePerpCancelByCloid(
    params: TeePerpCancelByCloidParameters,
    opts?: TeePerpCancelByCloidOptions,
  ): Promise<TeePerpCancelByCloidResponse> {
    return teePerpCancelByCloid(this.config_, params, opts);
  }

  /**
   * Cancel a TEE perp order by Hyperliquid order id (`POST /v1/tee-perp/cancels/submit-by-oid`).
   *
   * Signing: pre-signed EIP-712 `HLCancel` payload (`buildTeePerpCancelByOidTypedData`).
   */
  teePerpCancelByOid(
    params: TeePerpCancelByOidParameters,
    opts?: TeePerpCancelByOidOptions,
  ): Promise<TeePerpCancelByOidResponse> {
    return teePerpCancelByOid(this.config_, params, opts);
  }

  /**
   * Change a market's leverage and cross/isolated mode (`POST /v1/tee-perp/leverage/submit`).
   *
   * Signing: pre-signed EIP-712 `HCPerpLeverageChange` payload (`buildTeePerpLeverageTypedData`).
   */
  teePerpUpdateLeverage(
    params: TeePerpUpdateLeverageParameters,
    opts?: TeePerpUpdateLeverageOptions,
  ): Promise<TeePerpUpdateLeverageResponse> {
    return teePerpUpdateLeverage(this.config_, params, opts);
  }

  /** Allocate the account's TEE API wallet and return the manager's `HLAddApiWallet` approval payload. */
  teeApiWalletApprovalRequest(
    params: TeeApiWalletApprovalRequestParameters,
    opts?: TeeApiWalletApprovalRequestOptions,
  ): Promise<TeeApiWalletApprovalRequestResponse> {
    return teeApiWalletApprovalRequest(this.config_, params, opts);
  }

  /** Submit the manager-signed TEE API wallet approval. */
  teeApiWalletApprovalSubmit(
    params: TeeApiWalletApprovalSubmitParameters,
    opts?: TeeApiWalletApprovalSubmitOptions,
  ): Promise<TeeApiWalletApprovalSubmitResponse> {
    return teeApiWalletApprovalSubmit(this.config_, params, opts);
  }
}

export type { ExchangeConfig, ExchangeRequestOptions } from "./_methods/_base/mod.ts";
export type {
  AnyTeePerpResponse,
  EngineSeq,
  PerpRejectionReasonCode,
  TeePerpCancelResponse,
  TeePerpErrorCode,
  TeePerpLeverageResponse,
  TeePerpOrderBatchChildResponse,
  TeePerpOrderBatchResponse,
  TeePerpOrderResponse,
  TeePerpOrderStage,
  TeePerpVenueActionResponse,
} from "./_methods/_base/teePerp.ts";
export type {
  TeeApiWalletApprovalProgress,
  TeeApiWalletApprovalRequestOptions,
  TeeApiWalletApprovalRequestParameters,
  TeeApiWalletApprovalRequestResponse,
  TeeApiWalletApprovalSubmitOptions,
  TeeApiWalletApprovalSubmitParameters,
  TeeApiWalletApprovalSubmitResponse,
  TeeApiWalletApprovalTypedData,
} from "./_methods/teeApiWalletApproval.ts";
export type {
  TeePerpSubmitOrderOptions,
  TeePerpSubmitOrderParameters,
  TeePerpSubmitOrderResponse,
} from "./_methods/teePerpSubmitOrder.ts";
export type {
  TeePerpSubmitTriggerOrderOptions,
  TeePerpSubmitTriggerOrderParameters,
  TeePerpSubmitTriggerOrderResponse,
} from "./_methods/teePerpSubmitTriggerOrder.ts";
export type {
  TeePerpSubmitOrderBatchOptions,
  TeePerpSubmitOrderBatchParameters,
  TeePerpSubmitOrderBatchResponse,
} from "./_methods/teePerpSubmitOrderBatch.ts";
export type {
  TeePerpCancelByCloidOptions,
  TeePerpCancelByCloidParameters,
  TeePerpCancelByCloidResponse,
} from "./_methods/teePerpCancelByCloid.ts";
export type {
  TeePerpCancelByOidOptions,
  TeePerpCancelByOidParameters,
  TeePerpCancelByOidResponse,
} from "./_methods/teePerpCancelByOid.ts";
export type {
  TeePerpUpdateLeverageOptions,
  TeePerpUpdateLeverageParameters,
  TeePerpUpdateLeverageResponse,
} from "./_methods/teePerpUpdateLeverage.ts";
export type { OrderUpdateInfo, OrderUpdateMessage, OrderUpdateStatus } from "./_methods/_base/order.ts";
export type {
  AcceptRfqQuoteOptions,
  AcceptRfqQuoteParameters,
  AcceptRfqQuoteRequest,
  AcceptRfqQuoteResponse,
} from "./_methods/acceptRfqQuote.ts";
export type {
  ApproveAgentOptions,
  ApproveAgentParameters,
  ApproveAgentRequest,
  ApproveAgentResponse,
} from "./_methods/approveAgent.ts";
export type {
  BulkCancelOrderResult,
  BulkCancelOrdersOptions,
  BulkCancelOrdersParameters,
  BulkCancelOrdersRequest,
  BulkCancelOrdersResponse,
} from "./_methods/bulkCancelOrders.ts";
export type {
  BulkCancelOrdersByClientIdOptions,
  BulkCancelOrdersByClientIdParameters,
  BulkCancelOrdersByClientIdRequest,
  BulkCancelOrdersByClientIdResponse,
} from "./_methods/bulkCancelOrdersByClientId.ts";
export type {
  CancelOrderOptions,
  CancelOrderParameters,
  CancelOrderRequest,
  CancelOrderResponse,
} from "./_methods/cancelOrder.ts";
export type {
  CancelOrderByClientIdOptions,
  CancelOrderByClientIdParameters,
  CancelOrderByClientIdRequest,
  CancelOrderByClientIdResponse,
} from "./_methods/cancelOrderByClientId.ts";
export type {
  CreateReferralCodeOptions,
  CreateReferralCodeParameters,
  CreateReferralCodeRequest,
  CreateReferralCodeResponse,
} from "./_methods/createReferralCode.ts";
export type {
  PlaceOrderOptions,
  PlaceOrderParameters,
  PlaceOrderRequest,
  PlaceOrderResponse,
} from "./_methods/placeOrder.ts";
export type {
  ReplaceOrderOptions,
  ReplaceOrderParameters,
  ReplaceOrderRequest,
  ReplaceOrderResponse,
} from "./_methods/replaceOrder.ts";
export type {
  MarginModeResponse,
  MarginModeSelection,
  SetMarginModeOptions,
  SetMarginModeParameters,
  SetMarginModeRequest,
  SetMarginModeResponse,
} from "./_methods/setMarginMode.ts";
export type {
  RevokeAgentOptions,
  RevokeAgentParameters,
  RevokeAgentRequest,
  RevokeAgentResponse,
} from "./_methods/revokeAgent.ts";
export type {
  RevokeAllAgentsOptions,
  RevokeAllAgentsParameters,
  RevokeAllAgentsRequest,
  RevokeAllAgentsResponse,
} from "./_methods/revokeAllAgents.ts";
export type {
  SetReferrerOptions,
  SetReferrerParameters,
  SetReferrerRequest,
  SetReferrerResponse,
} from "./_methods/setReferrer.ts";
export type {
  SetSettlementPayoutsSeenOptions,
  SetSettlementPayoutsSeenParameters,
  SetSettlementPayoutsSeenRequest,
  SetSettlementPayoutsSeenResponse,
} from "./_methods/setSettlementPayoutsSeen.ts";
export type {
  StandardMarginLiquidationOrderResponse,
  StandardMarginLiquidationPositionRequest,
  SubmitStandardMarginLiquidationOptions,
  SubmitStandardMarginLiquidationParameters,
  SubmitStandardMarginLiquidationRequest,
  SubmitStandardMarginLiquidationResponse,
} from "./_methods/submitStandardMarginLiquidation.ts";
export type {
  SubmitRfqLeg,
  SubmitRfqOptions,
  SubmitRfqParameters,
  SubmitRfqRequest,
  SubmitRfqResponse,
} from "./_methods/submitRfq.ts";
export type {
  WithdrawUsdcOptions,
  WithdrawUsdcParameters,
  WithdrawUsdcRequest,
  WithdrawUsdcResponse,
} from "./_methods/withdrawUsdc.ts";
