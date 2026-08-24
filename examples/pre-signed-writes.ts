import {
  type AcceptRfqQuoteParameters,
  type ApproveAgentParameters,
  type BulkCancelOrdersByClientIdParameters,
  type BulkCancelOrdersParameters,
  type CancelOrderByClientIdParameters,
  type CancelOrderParameters,
  type CreateReferralCodeParameters,
  ExchangeClient,
  HttpTransport,
  type PlaceOrderParameters,
  type ReplaceOrderParameters,
  type RevokeAgentParameters,
  type RevokeAllAgentsParameters,
  type SetMarginModeParameters,
  type SetReferrerParameters,
  type SetSettlementPayoutsSeenParameters,
  type SubmitRfqParameters,
  type SubmitStandardMarginLiquidationParameters,
  type WithdrawUsdcParameters,
} from "@hypercall/sdk";

const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";
const agent = "0xab7bab0e4c09ff447863f507c16090a9a02792d2";
const signature = "0xsignature";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const exchange = new ExchangeClient({ transport });

const approveAgentRequest = {
  agent,
  nonce: 1,
  signature,
} satisfies ApproveAgentParameters;

const revokeAgentRequest = {
  agent,
  nonce: 2,
  signature,
} satisfies RevokeAgentParameters;

const revokeAllAgentsRequest = {
  nonce: 3,
  signature,
} satisfies RevokeAllAgentsParameters;

const createReferralCodeRequest = {
  wallet,
  code: "ALPHA",
  nonce: 4,
  signature,
} satisfies CreateReferralCodeParameters;

const setReferrerRequest = {
  wallet,
  code: "BETA",
  referrer: agent,
  nonce: 5,
  signature,
} satisfies SetReferrerParameters;

const placeOrderRequest = {
  wallet,
  symbol: "BTC-30JUN26-100000-C",
  side: "Buy",
  size: "0.1",
  price: "100",
  tif: "gtc",
  route: "book_only",
  client_id: "client-123",
  reduce_only: true,
  nonce: 6,
  signature,
} satisfies PlaceOrderParameters;

const replaceOrderRequest = {
  wallet,
  order_id: 123,
  symbol: "BTC-30JUN26-100000-C",
  side: "Sell",
  size: "0.1",
  price: "101",
  tif: "ioc",
  client_id: "client-124",
  reduce_only: true,
  nonce: 7,
  signature,
} satisfies ReplaceOrderParameters;

const cancelOrderRequest = {
  wallet,
  order_id: 123,
  nonce: 8,
  signature,
} satisfies CancelOrderParameters;

const cancelOrderByClientIdRequest = {
  wallet,
  client_id: "client-123",
  nonce: 9,
  signature,
} satisfies CancelOrderByClientIdParameters;

const bulkCancelOrdersRequest = {
  cancels: [cancelOrderRequest],
} satisfies BulkCancelOrdersParameters;

const bulkCancelOrdersByClientIdRequest = {
  cancels: [cancelOrderByClientIdRequest],
} satisfies BulkCancelOrdersByClientIdParameters;

const setMarginModeRequest = {
  wallet,
  margin_mode: "portfolio",
  nonce: 10,
  signature,
} satisfies SetMarginModeParameters;

const setSettlementPayoutsSeenRequest = {
  wallet,
  ids: [123],
  nonce: 11,
  signature,
} satisfies SetSettlementPayoutsSeenParameters;

const submitRfqRequest = {
  rfq_id: "00000000-0000-0000-0000-000000000000",
  legs: [{ instrument: "BTC-30JUN26-100000-C", side: "Buy", size: "0.1" }],
  wallet_address: wallet,
  nonce: 12,
  signature,
} satisfies SubmitRfqParameters;

const acceptRfqQuoteRequest = {
  rfq_id: "00000000-0000-0000-0000-000000000000",
  quote_id: "11111111-1111-1111-1111-111111111111",
  wallet_address: wallet,
  nonce: 13,
  signature,
} satisfies AcceptRfqQuoteParameters;

const submitStandardMarginLiquidationRequest = {
  wallet,
  liquidated_wallet: agent,
  request_id: "00000000-0000-0000-0000-000000000000",
  auction_id: "auction-1",
  bid_usdc: "100",
  positions: [{ symbol: "BTC-30JUN26-100000-C", quantity: "1", entry_price: "10" }],
  portfolio_hash: "0xportfolio",
  auction_terms_hash: "0xterms",
  auction_version: 1,
  valuation_timestamp_ms: 1,
  bid_intent_hash: "intent-1",
  nonce: 14,
  signature,
} satisfies SubmitStandardMarginLiquidationParameters;

const withdrawUsdcRequest = {
  wallet,
  account: wallet,
  destination: wallet,
  amount: "100",
  nonce: 15,
  signature,
} satisfies WithdrawUsdcParameters;

async function submitPreSignedWriteExamples() {
  await exchange.approveAgent(approveAgentRequest);
  await exchange.revokeAgent(revokeAgentRequest);
  await exchange.revokeAllAgents(revokeAllAgentsRequest);
  await exchange.createReferralCode(createReferralCodeRequest);
  await exchange.setReferrer(setReferrerRequest);
  await exchange.placeOrder(placeOrderRequest);
  await exchange.replaceOrder(replaceOrderRequest);
  await exchange.cancelOrder(cancelOrderRequest);
  await exchange.cancelOrderByClientId(cancelOrderByClientIdRequest);
  await exchange.bulkCancelOrders(bulkCancelOrdersRequest);
  await exchange.bulkCancelOrdersByClientId(bulkCancelOrdersByClientIdRequest);
  await exchange.setMarginMode(setMarginModeRequest);
  await exchange.setSettlementPayoutsSeen(setSettlementPayoutsSeenRequest);
  await exchange.submitRfq(submitRfqRequest);
  await exchange.acceptRfqQuote(acceptRfqQuoteRequest);
  await exchange.submitStandardMarginLiquidation(submitStandardMarginLiquidationRequest);
  await exchange.withdrawUsdc(withdrawUsdcRequest);
}

console.log({
  note: "Request shapes only. submitPreSignedWriteExamples is intentionally not invoked.",
  approveAgent: approveAgentRequest,
  revokeAgent: revokeAgentRequest,
  revokeAllAgents: revokeAllAgentsRequest,
  createReferralCode: createReferralCodeRequest,
  setReferrer: setReferrerRequest,
  placeOrder: placeOrderRequest,
  replaceOrder: replaceOrderRequest,
  cancelOrder: cancelOrderRequest,
  cancelOrderByClientId: cancelOrderByClientIdRequest,
  bulkCancelOrders: bulkCancelOrdersRequest,
  bulkCancelOrdersByClientId: bulkCancelOrdersByClientIdRequest,
  setMarginMode: setMarginModeRequest,
  setSettlementPayoutsSeen: setSettlementPayoutsSeenRequest,
  submitRfq: submitRfqRequest,
  acceptRfqQuote: acceptRfqQuoteRequest,
  submitStandardMarginLiquidation: submitStandardMarginLiquidationRequest,
  withdrawUsdc: withdrawUsdcRequest,
  submitFunctionName: submitPreSignedWriteExamples.name,
});
