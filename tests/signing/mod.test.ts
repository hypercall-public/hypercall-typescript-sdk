// deno-lint-ignore-file no-import-prefix
import assert from "node:assert/strict";

import { recoverTypedDataAddress } from "npm:viem@2";
import { privateKeyToAccount } from "npm:viem@2/accounts";

import {
  ACCEPT_RFQ_QUOTE_TYPES,
  APPROVE_AGENT_TYPES,
  buildAcceptRfqQuoteValue,
  buildApproveAgentValue,
  buildCancelOrderByClientIdValue,
  buildCancelOrderValue,
  buildCreateReferralCodeValue,
  buildPlaceOrderReduceOnlyValue,
  buildPlaceOrderValue,
  buildReplaceOrderReduceOnlyValue,
  buildReplaceOrderValue,
  buildRevokeAgentValue,
  buildRevokeAllAgentsValue,
  buildSetMarginModeValue,
  buildSetReferrerValue,
  buildSetSettlementPayoutSeenValue,
  buildSignedBody,
  buildStandardMarginLiquidationOrderValue,
  buildSubmitAutoExecuteRfqValue,
  buildSubmitRfqValue,
  buildTypedData,
  buildWithdrawUsdcValue,
  CANCEL_ORDER_BY_CLOID_TYPES,
  CANCEL_ORDER_TYPES,
  CREATE_REFERRAL_CODE_TYPES,
  createHypercallDomain,
  HYPERCALL_DOMAIN_FIELDS,
  HYPERCALL_VERIFYING_CONTRACT,
  PLACE_ORDER_REDUCE_ONLY_TYPES,
  PLACE_ORDER_TYPES,
  REPLACE_ORDER_REDUCE_ONLY_TYPES,
  REPLACE_ORDER_TYPES,
  REVOKE_AGENT_TYPES,
  REVOKE_ALL_AGENTS_TYPES,
  SET_MARGIN_MODE_TYPES,
  SET_REFERRER_TYPES,
  SET_SETTLEMENT_PAYOUT_SEEN_TYPES,
  STANDARD_MARGIN_LIQUIDATION_ORDER_TYPES,
  SUBMIT_AUTO_EXECUTE_RFQ_TYPES,
  SUBMIT_RFQ_TYPES,
  WITHDRAW_USDC_TYPES,
} from "../../src/signing/mod.ts";

const suiteStack: string[] = [];

function describe(name: string, fn: () => void): void {
  suiteStack.push(name);
  try {
    fn();
  } finally {
    suiteStack.pop();
  }
}

function test(name: string, fn: () => void | Promise<void>): void {
  Deno.test([...suiteStack, name].join(" - "), fn);
}

const WALLET = "0xE55B5E5E38F73C30AA367D310D6247F3F9A5E86E";
const LOWER_WALLET = WALLET.toLowerCase();
const AGENT = "0xAB7Bab0e4c09Ff447863f507C16090A9A02792d2";
const LOWER_AGENT = AGENT.toLowerCase();
const VECTOR_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae2f36eb873f6fb9d8e20f6f8";
const VECTOR_ACCOUNT = privateKeyToAccount(VECTOR_PRIVATE_KEY);
const VECTOR_WALLET = VECTOR_ACCOUNT.address;
const LOWER_VECTOR_WALLET = VECTOR_WALLET.toLowerCase();
const VECTOR_DESTINATION = "0x2222222222222222222222222222222222222222";
const VECTOR_CHAIN_ID = 998;
const RFQ_ID = "0x1111111111111111111111111111111111111111111111111111111111111111";
const LEGS_HASH = "0x2222222222222222222222222222222222222222222222222222222222222222";
const QUOTE_ID = "0x3333333333333333333333333333333333333333333333333333333333333333";

type TestTypedData = ReturnType<typeof buildTypedData<string, Record<string, unknown>>>;
type ViemTypedData = Parameters<typeof VECTOR_ACCOUNT.signTypedData>[0];

function toViemTypedData(typedData: TestTypedData): ViemTypedData {
  const { EIP712Domain: _eip712Domain, ...types } = typedData.types;

  return {
    domain: typedData.domain,
    types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  } as unknown as ViemTypedData;
}

describe("signing helpers", () => {
  test("exposes the Hypercall EIP-712 domain fields", () => {
    assert.deepEqual(createHypercallDomain(999), {
      name: "Hypercall",
      version: "1",
      chainId: 999,
      verifyingContract: HYPERCALL_VERIFYING_CONTRACT,
    });
    assert.deepEqual(HYPERCALL_DOMAIN_FIELDS, [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ]);
  });

  test("buildTypedData matches the frontend EIP-712 envelope shape", () => {
    const message = buildApproveAgentValue(AGENT, 42);
    const typedData = buildTypedData({
      chainId: 998,
      primaryType: "ApproveAgent",
      types: APPROVE_AGENT_TYPES,
      message,
    });

    assert.deepEqual(typedData, {
      domain: {
        name: "Hypercall",
        version: "1",
        chainId: 998,
        verifyingContract: HYPERCALL_VERIFYING_CONTRACT,
      },
      types: {
        EIP712Domain: HYPERCALL_DOMAIN_FIELDS,
        ApproveAgent: [
          { name: "agent", type: "address" },
          { name: "nonce", type: "uint64" },
        ],
      },
      primaryType: "ApproveAgent",
      message: {
        agent: LOWER_AGENT,
        nonce: 42n,
      },
    });
  });

  test("exports typed-data maps used by current write actions", () => {
    assert.deepEqual(APPROVE_AGENT_TYPES.ApproveAgent, [
      { name: "agent", type: "address" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(REVOKE_AGENT_TYPES.RevokeAgent, [
      { name: "agent", type: "address" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(REVOKE_ALL_AGENTS_TYPES.RevokeAllAgents, [
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(PLACE_ORDER_TYPES.PlaceOrder, [
      { name: "wallet", type: "address" },
      { name: "symbol", type: "string" },
      { name: "side", type: "string" },
      { name: "size", type: "string" },
      { name: "price", type: "string" },
      { name: "tif", type: "string" },
      { name: "route", type: "string" },
      { name: "clientId", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(REPLACE_ORDER_TYPES.ReplaceOrder, [
      { name: "wallet", type: "address" },
      { name: "orderId", type: "string" },
      { name: "symbol", type: "string" },
      { name: "side", type: "string" },
      { name: "size", type: "string" },
      { name: "price", type: "string" },
      { name: "tif", type: "string" },
      { name: "clientId", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(PLACE_ORDER_REDUCE_ONLY_TYPES.PlaceOrderReduceOnly, [
      ...PLACE_ORDER_TYPES.PlaceOrder.slice(0, -1),
      { name: "reduceOnly", type: "bool" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(REPLACE_ORDER_REDUCE_ONLY_TYPES.ReplaceOrderReduceOnly, [
      ...REPLACE_ORDER_TYPES.ReplaceOrder.slice(0, -1),
      { name: "reduceOnly", type: "bool" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(CREATE_REFERRAL_CODE_TYPES.CreateReferralCode, [
      { name: "wallet", type: "address" },
      { name: "code", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(SET_REFERRER_TYPES.SetReferrer, [
      { name: "wallet", type: "address" },
      { name: "referrer", type: "address" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(CANCEL_ORDER_TYPES.CancelOrder, [
      { name: "wallet", type: "address" },
      { name: "orderId", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(CANCEL_ORDER_BY_CLOID_TYPES.CancelOrderByClientId, [
      { name: "wallet", type: "address" },
      { name: "clientId", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(SET_MARGIN_MODE_TYPES.SetMarginMode, [
      { name: "wallet", type: "address" },
      { name: "marginMode", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(SET_SETTLEMENT_PAYOUT_SEEN_TYPES.SetSettlementPayoutSeen, [
      { name: "wallet", type: "address" },
      { name: "payoutIds", type: "string" },
      { name: "seen", type: "bool" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(STANDARD_MARGIN_LIQUIDATION_ORDER_TYPES.StandardMarginLiquidationOrder, [
      { name: "wallet", type: "address" },
      { name: "liquidatedWallet", type: "address" },
      { name: "requestId", type: "string" },
      { name: "auctionId", type: "string" },
      { name: "bidUsdc", type: "string" },
      { name: "portfolioHash", type: "string" },
      { name: "auctionTermsHash", type: "string" },
      { name: "bidIntentHash", type: "string" },
      { name: "auctionVersion", type: "uint64" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(WITHDRAW_USDC_TYPES.WithdrawUsdc, [
      { name: "wallet", type: "address" },
      { name: "account", type: "address" },
      { name: "destination", type: "address" },
      { name: "amount", type: "string" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(SUBMIT_RFQ_TYPES.SubmitRFQ, [
      { name: "rfqId", type: "bytes32" },
      { name: "legsHash", type: "bytes32" },
      { name: "wallet", type: "address" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(SUBMIT_AUTO_EXECUTE_RFQ_TYPES.SubmitAutoExecuteRfq, [
      { name: "rfqId", type: "bytes32" },
      { name: "legsHash", type: "bytes32" },
      { name: "limitPrice", type: "int256" },
      { name: "wallet", type: "address" },
      { name: "nonce", type: "uint64" },
    ]);
    assert.deepEqual(ACCEPT_RFQ_QUOTE_TYPES.AcceptRFQQuote, [
      { name: "rfqId", type: "bytes32" },
      { name: "quoteId", type: "bytes32" },
      { name: "netPremium", type: "int256" },
      { name: "wallet", type: "address" },
      { name: "nonce", type: "uint64" },
    ]);
  });

  test("normalizes typed-data values the same way as the frontend helpers", () => {
    assert.deepEqual(buildApproveAgentValue(AGENT, 6), {
      agent: LOWER_AGENT,
      nonce: 6n,
    });
    assert.deepEqual(buildRevokeAgentValue(AGENT, 6), {
      agent: LOWER_AGENT,
      nonce: 6n,
    });
    assert.deepEqual(buildRevokeAllAgentsValue(7), {
      nonce: 7n,
    });
    assert.deepEqual(
      buildPlaceOrderValue({
        wallet: WALLET,
        symbol: "BTC-260626-100000-C",
        side: "Buy",
        size: "1",
        price: "2.5",
        tif: "gtc",
        route: "book_only",
        clientId: "client-route-1",
        nonce: 7,
      }),
      {
        wallet: LOWER_WALLET,
        symbol: "BTC-260626-100000-C",
        side: "Buy",
        size: "1",
        price: "2.5",
        tif: "gtc",
        route: "book_only",
        clientId: "client-route-1",
        nonce: 7n,
      },
    );

    assert.deepEqual(
      buildReplaceOrderValue({
        wallet: WALLET,
        orderId: "123",
        symbol: "BTC-260626-100000-C",
        side: "Sell",
        size: "0.5",
        price: "3.5",
        tif: "ioc",
        clientId: "client-1",
        nonce: 8,
      }),
      {
        wallet: LOWER_WALLET,
        orderId: "123",
        symbol: "BTC-260626-100000-C",
        side: "Sell",
        size: "0.5",
        price: "3.5",
        tif: "ioc",
        clientId: "client-1",
        nonce: 8n,
      },
    );

    assert.deepEqual(
      buildPlaceOrderReduceOnlyValue({
        wallet: WALLET,
        symbol: "BTC-260626-100000-C",
        side: "Sell",
        size: "0.25",
        price: "4.5",
        tif: "fok",
        route: "best_execution",
        nonce: 9,
      }),
      {
        wallet: LOWER_WALLET,
        symbol: "BTC-260626-100000-C",
        side: "Sell",
        size: "0.25",
        price: "4.5",
        tif: "fok",
        route: "best_execution",
        clientId: "",
        reduceOnly: true,
        nonce: 9n,
      },
    );

    assert.deepEqual(
      buildReplaceOrderReduceOnlyValue({
        wallet: WALLET,
        orderId: "123",
        symbol: "BTC-260626-100000-C",
        side: "Buy",
        size: "0.25",
        price: "4.5",
        tif: "gtc",
        nonce: 10,
      }),
      {
        wallet: LOWER_WALLET,
        orderId: "123",
        symbol: "BTC-260626-100000-C",
        side: "Buy",
        size: "0.25",
        price: "4.5",
        tif: "gtc",
        clientId: "",
        reduceOnly: true,
        nonce: 10n,
      },
    );

    assert.deepEqual(
      buildCreateReferralCodeValue({ wallet: WALLET, code: " MiXeD ", nonce: 11 }),
      { wallet: LOWER_WALLET, code: " MiXeD ", nonce: 11n },
    );
    assert.deepEqual(
      buildSetReferrerValue({ wallet: WALLET, referrer: AGENT, nonce: 12 }),
      { wallet: LOWER_WALLET, referrer: LOWER_AGENT, nonce: 12n },
    );

    assert.deepEqual(
      buildCancelOrderValue({
        wallet: WALLET,
        orderId: "123",
        nonce: 9,
      }),
      {
        wallet: LOWER_WALLET,
        orderId: "123",
        nonce: 9n,
      },
    );

    assert.deepEqual(
      buildCancelOrderByClientIdValue({
        wallet: WALLET,
        clientId: "client-2",
        nonce: 10,
      }),
      {
        wallet: LOWER_WALLET,
        clientId: "client-2",
        nonce: 10n,
      },
    );

    assert.deepEqual(
      buildSetMarginModeValue({
        wallet: WALLET,
        marginMode: "portfolio",
        nonce: 11,
      }),
      {
        wallet: LOWER_WALLET,
        marginMode: "portfolio",
        nonce: 11n,
      },
    );

    assert.deepEqual(
      buildSetSettlementPayoutSeenValue({
        wallet: WALLET,
        ids: [1, 2, 3],
        nonce: 12,
      }),
      {
        wallet: LOWER_WALLET,
        payoutIds: "1,2,3",
        seen: true,
        nonce: 12n,
      },
    );

    assert.throws(
      () => buildSetSettlementPayoutSeenValue({ wallet: WALLET, ids: [1, 1.5], nonce: 12 }),
      /positive safe integers/,
    );

    assert.deepEqual(
      buildStandardMarginLiquidationOrderValue({
        wallet: WALLET,
        liquidatedWallet: AGENT,
        requestId: "00000000-0000-0000-0000-000000000000",
        auctionId: "auction-1",
        bidUsdc: "100",
        portfolioHash: "0xportfolio",
        auctionTermsHash: "0xterms",
        bidIntentHash: "intent-1",
        auctionVersion: 2,
        nonce: 13,
      }),
      {
        wallet: LOWER_WALLET,
        liquidatedWallet: LOWER_AGENT,
        requestId: "00000000-0000-0000-0000-000000000000",
        auctionId: "auction-1",
        bidUsdc: "100",
        portfolioHash: "0xportfolio",
        auctionTermsHash: "0xterms",
        bidIntentHash: "intent-1",
        auctionVersion: 2n,
        nonce: 13n,
      },
    );

    assert.deepEqual(
      buildWithdrawUsdcValue({
        wallet: WALLET,
        account: WALLET,
        destination: AGENT,
        amount: "500.00",
        nonce: 14,
      }),
      {
        wallet: LOWER_WALLET,
        account: LOWER_WALLET,
        destination: LOWER_AGENT,
        amount: "500.00",
        nonce: 14n,
      },
    );

    assert.deepEqual(
      buildSubmitRfqValue({
        rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        legsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        wallet: WALLET,
        nonce: 14,
      }),
      {
        rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        legsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        wallet: LOWER_WALLET,
        nonce: 14n,
      },
    );

    assert.deepEqual(
      buildSubmitAutoExecuteRfqValue({
        rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        legsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        limitPrice: -99n,
        wallet: WALLET,
        nonce: "15",
      }),
      {
        rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        legsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        limitPrice: -99n,
        wallet: LOWER_WALLET,
        nonce: 15n,
      },
    );

    assert.deepEqual(
      buildAcceptRfqQuoteValue({
        rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        quoteId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        netPremium: -12n,
        wallet: WALLET,
        nonce: 16,
      }),
      {
        rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        quoteId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        netPremium: -12n,
        wallet: LOWER_WALLET,
        nonce: 16n,
      },
    );
  });

  test("buildTypedData snapshots current signed write envelopes", () => {
    const liquidationMessage = buildStandardMarginLiquidationOrderValue({
      wallet: WALLET,
      liquidatedWallet: AGENT,
      requestId: "00000000-0000-0000-0000-000000000000",
      auctionId: "auction-1",
      bidUsdc: "100",
      portfolioHash: "0xportfolio",
      auctionTermsHash: "0xterms",
      bidIntentHash: "intent-1",
      auctionVersion: 2,
      nonce: 18,
    });

    assert.deepEqual(
      buildTypedData({
        chainId: 998,
        primaryType: "StandardMarginLiquidationOrder",
        types: STANDARD_MARGIN_LIQUIDATION_ORDER_TYPES,
        message: liquidationMessage,
      }),
      {
        domain: {
          name: "Hypercall",
          version: "1",
          chainId: 998,
          verifyingContract: HYPERCALL_VERIFYING_CONTRACT,
        },
        types: {
          EIP712Domain: HYPERCALL_DOMAIN_FIELDS,
          StandardMarginLiquidationOrder: STANDARD_MARGIN_LIQUIDATION_ORDER_TYPES.StandardMarginLiquidationOrder,
        },
        primaryType: "StandardMarginLiquidationOrder",
        message: liquidationMessage,
      },
    );

    const autoRfqMessage = buildSubmitAutoExecuteRfqValue({
      rfqId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      legsHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      limitPrice: 1000000n,
      wallet: WALLET,
      nonce: "19",
    });

    assert.deepEqual(
      buildTypedData({
        chainId: 998,
        primaryType: "SubmitAutoExecuteRfq",
        types: SUBMIT_AUTO_EXECUTE_RFQ_TYPES,
        message: autoRfqMessage,
      }),
      {
        domain: {
          name: "Hypercall",
          version: "1",
          chainId: 998,
          verifyingContract: HYPERCALL_VERIFYING_CONTRACT,
        },
        types: {
          EIP712Domain: HYPERCALL_DOMAIN_FIELDS,
          SubmitAutoExecuteRfq: SUBMIT_AUTO_EXECUTE_RFQ_TYPES.SubmitAutoExecuteRfq,
        },
        primaryType: "SubmitAutoExecuteRfq",
        message: autoRfqMessage,
      },
    );
  });

  test("new production action types sign and recover with viem", async () => {
    const typedDataValues: TestTypedData[] = [
      buildTypedData({
        chainId: VECTOR_CHAIN_ID,
        primaryType: "RevokeAllAgents",
        types: REVOKE_ALL_AGENTS_TYPES,
        message: buildRevokeAllAgentsValue(201),
      }),
      buildTypedData({
        chainId: VECTOR_CHAIN_ID,
        primaryType: "PlaceOrderReduceOnly",
        types: PLACE_ORDER_REDUCE_ONLY_TYPES,
        message: buildPlaceOrderReduceOnlyValue({
          wallet: VECTOR_WALLET,
          symbol: "BTC-30JUN26-100000-C",
          side: "Sell",
          size: "0.1",
          price: "100",
          tif: "gtc",
          route: "book_only",
          nonce: 202,
        }),
      }),
      buildTypedData({
        chainId: VECTOR_CHAIN_ID,
        primaryType: "ReplaceOrderReduceOnly",
        types: REPLACE_ORDER_REDUCE_ONLY_TYPES,
        message: buildReplaceOrderReduceOnlyValue({
          wallet: VECTOR_WALLET,
          orderId: "123",
          symbol: "BTC-30JUN26-100000-C",
          side: "Sell",
          size: "0.1",
          price: "99",
          tif: "ioc",
          nonce: 203,
        }),
      }),
      buildTypedData({
        chainId: VECTOR_CHAIN_ID,
        primaryType: "CreateReferralCode",
        types: CREATE_REFERRAL_CODE_TYPES,
        message: buildCreateReferralCodeValue({ wallet: VECTOR_WALLET, code: "ALPHA", nonce: 204 }),
      }),
      buildTypedData({
        chainId: VECTOR_CHAIN_ID,
        primaryType: "SetReferrer",
        types: SET_REFERRER_TYPES,
        message: buildSetReferrerValue({ wallet: VECTOR_WALLET, referrer: AGENT, nonce: 205 }),
      }),
    ];

    for (const typedDataValue of typedDataValues) {
      const typedData = toViemTypedData(typedDataValue);
      const signature = await VECTOR_ACCOUNT.signTypedData(typedData);
      const recovered = await recoverTypedDataAddress({ ...typedData, signature });

      assert.equal(recovered.toLowerCase(), LOWER_VECTOR_WALLET, typedDataValue.primaryType);
    }
  });

  test("golden signatures match current EIP-712 payloads", async () => {
    const vectors = [
      {
        name: "approveAgent",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "ApproveAgent",
          types: APPROVE_AGENT_TYPES,
          message: buildApproveAgentValue(AGENT, 101),
        }),
        signature:
          "0x73c077c2c79c84e55e85e92b766a3a333237270daf117002f00264d4aa51750f06b7835cfa81358d634ce97dab8807c8f0f9b378800df894ddfc715f5901bbee1b",
      },
      {
        name: "revokeAgent",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "RevokeAgent",
          types: REVOKE_AGENT_TYPES,
          message: buildRevokeAgentValue(AGENT, 102),
        }),
        signature:
          "0x33537bca4c96828d3ee1590770c166e5fd1089fc1aecd69bd36457a6e0e1e6843c242b2a5d460af9e3709f3319fc921f7d6a9dd87cc238269627c923728460c11b",
      },
      {
        name: "placeOrder",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "PlaceOrder",
          types: PLACE_ORDER_TYPES,
          message: buildPlaceOrderValue({
            wallet: VECTOR_WALLET,
            symbol: "BTC-30JUN26-100000-C",
            side: "Buy",
            size: "0.1",
            price: "100",
            tif: "gtc",
            route: "book_only",
            clientId: "client-123",
            nonce: 103,
          }),
        }),
        signature:
          "0xc66973933f9395012fc2e67e49e1b4178f076c5f6de2f6ec93a88127d5dad46f0a5b0503c9980eb73ca4ca071cde84e2584be6db4add8cd02e94f7dfc81c00111b",
      },
      {
        name: "replaceOrder",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "ReplaceOrder",
          types: REPLACE_ORDER_TYPES,
          message: buildReplaceOrderValue({
            wallet: VECTOR_WALLET,
            orderId: "123",
            symbol: "BTC-30JUN26-100000-C",
            side: "Sell",
            size: "0.2",
            price: "101",
            tif: "ioc",
            clientId: "client-124",
            nonce: 104,
          }),
        }),
        signature:
          "0x23627b4202016da7c182aaf3d8fa726013d8e0b8724f0f62b54e5c3df1f226c57437837b74390f6bc3f03624cdf4e6d910ca48d5666383cf2dff397c9c47e00b1b",
      },
      {
        name: "cancelOrder",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "CancelOrder",
          types: CANCEL_ORDER_TYPES,
          message: buildCancelOrderValue({
            wallet: VECTOR_WALLET,
            orderId: "123",
            nonce: 105,
          }),
        }),
        signature:
          "0x73f80b98e6d91ff0395e28f62bca33150490e8cd7425e8d8de3593c6640343bc5014da27ac87c040c32d082d34c2943f6ffd39b2b9e0a59c178a17f85e94f60a1b",
      },
      {
        name: "cancelOrderByClientId",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "CancelOrderByClientId",
          types: CANCEL_ORDER_BY_CLOID_TYPES,
          message: buildCancelOrderByClientIdValue({
            wallet: VECTOR_WALLET,
            clientId: "client-123",
            nonce: 106,
          }),
        }),
        signature:
          "0x5eafaf3c1d3cfc5e5c25cb36ebfaa2d7328f3cf8dc2104257b5520fd1be5abc30a274cc4cdec79d49506d7cb3de3ef729386c5863ab2c8cbef2282804e2575341c",
      },
      {
        name: "setMarginMode",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "SetMarginMode",
          types: SET_MARGIN_MODE_TYPES,
          message: buildSetMarginModeValue({
            wallet: VECTOR_WALLET,
            marginMode: "portfolio",
            nonce: 107,
          }),
        }),
        signature:
          "0x7ac635ff30959ee7f47044a3e305dd1d207625ebf61631bcc1b73f68f0ea86985ebb6b92e6098f2830a4e2be727905350c00979d7eaeb9f3cb4b4b912a7d05bd1c",
      },
      {
        name: "setSettlementPayoutSeen",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "SetSettlementPayoutSeen",
          types: SET_SETTLEMENT_PAYOUT_SEEN_TYPES,
          message: buildSetSettlementPayoutSeenValue({
            wallet: VECTOR_WALLET,
            ids: [1, 2, 3],
            nonce: 108,
          }),
        }),
        signature:
          "0x01f8164dd358a4133bf6ee719e26a9dcb2f49583084998b969e2c77e26757ac67ec0a1dbaa28f26d7760733d513c642f4773eb77393b31c8d78b6d7b368f3bd91b",
      },
      {
        name: "standardMarginLiquidationOrder",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "StandardMarginLiquidationOrder",
          types: STANDARD_MARGIN_LIQUIDATION_ORDER_TYPES,
          message: buildStandardMarginLiquidationOrderValue({
            wallet: VECTOR_WALLET,
            liquidatedWallet: AGENT,
            requestId: "00000000-0000-0000-0000-000000000000",
            auctionId: "auction-1",
            bidUsdc: "100",
            portfolioHash: "0xportfolio",
            auctionTermsHash: "0xterms",
            bidIntentHash: "intent-1",
            auctionVersion: 2,
            nonce: 109,
          }),
        }),
        signature:
          "0x6dda08bbb3a2314ebb306a834a3f732effd243a998a66405d6cfbbd1a7daec4c0871d5151c4df3e617493df7d3ff6ae60f703af114719bcb20f155882a7651391c",
      },
      {
        name: "withdrawUsdc",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "WithdrawUsdc",
          types: WITHDRAW_USDC_TYPES,
          message: buildWithdrawUsdcValue({
            wallet: VECTOR_WALLET,
            account: VECTOR_WALLET,
            destination: VECTOR_DESTINATION,
            amount: "500.00",
            nonce: 110,
          }),
        }),
        signature:
          "0x6e004493fe836a216a717e175c7476782789fc3fbd675cac4d1bd0805f87ed6761b75184f77ec5f4b7f746dac228521dab09384b8d5c6e56387be65f29f132481b",
      },
      {
        name: "submitRfq",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "SubmitRFQ",
          types: SUBMIT_RFQ_TYPES,
          message: buildSubmitRfqValue({
            rfqId: RFQ_ID,
            legsHash: LEGS_HASH,
            wallet: VECTOR_WALLET,
            nonce: 111,
          }),
        }),
        signature:
          "0x2b7262cdd5939e24c33f128f396c96e1e371edf72f7661dc132ab785de7bcbea39b992a0db115dadb646896b2f337ee5a7acecfb2160b0d52ef759c69d1d195a1b",
      },
      {
        name: "submitAutoExecuteRfq",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "SubmitAutoExecuteRfq",
          types: SUBMIT_AUTO_EXECUTE_RFQ_TYPES,
          message: buildSubmitAutoExecuteRfqValue({
            rfqId: RFQ_ID,
            legsHash: LEGS_HASH,
            limitPrice: -99000000n,
            wallet: VECTOR_WALLET,
            nonce: "112",
          }),
        }),
        signature:
          "0x40ebbe5a39ceb22dd56da4282d568763ffe32323170a24022b555c2da0fac4b91d29b0225291b8f702112a6283b5663c1975a518e6affde04bcaec1955b6bfb31c",
      },
      {
        name: "acceptRfqQuote",
        typedData: buildTypedData({
          chainId: VECTOR_CHAIN_ID,
          primaryType: "AcceptRFQQuote",
          types: ACCEPT_RFQ_QUOTE_TYPES,
          message: buildAcceptRfqQuoteValue({
            rfqId: RFQ_ID,
            quoteId: QUOTE_ID,
            netPremium: -123456n,
            wallet: VECTOR_WALLET,
            nonce: 113,
          }),
        }),
        signature:
          "0xad0bc4765778e3ec0d3e61b1eaaaae530e3e50dd38fbac0cecfbf840b462e4b94a4d9df1cdfb98ff88f2616f5ffc89c0e1b6aad50b896e08d32c378c1daeaf2c1c",
      },
    ];

    assert.equal(LOWER_VECTOR_WALLET, "0x302f53179d4bc1640bf1caae05ecac089b4946c8");

    for (const vector of vectors) {
      const typedData = toViemTypedData(vector.typedData);
      const signature = await VECTOR_ACCOUNT.signTypedData(typedData);

      assert.equal(signature, vector.signature, vector.name);

      const recovered = await recoverTypedDataAddress({
        ...typedData,
        signature,
      });

      assert.equal(recovered.toLowerCase(), LOWER_VECTOR_WALLET, vector.name);
    }
  });

  test("buildSignedBody lowercases wallet and strips ignored signer for pre-signed requests", () => {
    assert.deepEqual(
      buildSignedBody({
        wallet: WALLET,
        signer: AGENT,
        nonce: 11,
        signature: "0xsignature",
        ids: [1, 2],
      }),
      {
        ids: [1, 2],
        wallet: LOWER_WALLET,
        signature: "0xsignature",
        nonce: 11,
      },
    );
  });
});
