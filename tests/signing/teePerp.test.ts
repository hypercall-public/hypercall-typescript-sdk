// deno-lint-ignore-file no-import-prefix
import assert from "node:assert/strict";

import { encodeFunctionData, hashTypedData, recoverTypedDataAddress } from "npm:viem@2";
import { privateKeyToAccount } from "npm:viem@2/accounts";

import {
  ACCOUNT_BUILDER_APPROVAL_ABI,
  BuilderApprovalRequiredError,
  buildHlCancelByCloidAction,
  buildHlCancelByOidAction,
  buildHlLimitOrderAction,
  buildHypercallAuthenticationMessage,
  buildPerpScaleOrderLegs,
  buildTeePerpBracketBatchAction,
  buildTeePerpCancelByCloidTypedData,
  buildTeePerpCancelByOidTypedData,
  buildTeePerpLeverageAction,
  buildTeePerpLeverageTypedData,
  buildTeePerpLimitOrderTypedData,
  buildTeePerpOrderBatchTypedData,
  buildTeePerpPositionTpslBatchAction,
  buildTeePerpScaleBatchAction,
  buildTeePerpTriggerOrderTypedData,
  buildTeePerpTriggerOrderWire,
  createHypercallManagerSignDomain,
  createServerClock,
  deriveTeePerpBatchCloid,
  DIRECTIVE_DOMAIN_FIELDS,
  encodeApproveZeroFeeBuilderCalldata,
  encodePerpTif,
  formatPerpMarketLimitPrice,
  HL_ADD_API_WALLET_TYPES,
  isTeePerpNonceFresh,
  resolveHypercallBuilderAddress,
  resolvePerpTriggerLimitPrice,
  roundPerpPriceToTick,
  scalePerpDecimalTo1e8,
  serverClockOffsetMs,
  TeePerpNonceManager,
  toPerpOrderTerms,
} from "../../src/signing/mod.ts";

function test(name: string, fn: () => void | Promise<void>): void {
  Deno.test(`TEE perp signing - ${name}`, fn);
}

const ACCOUNT = "0x1111111111111111111111111111111111111111";
const NONCE = 1_785_672_000_000;
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Known-answer digests computed with alloy `sol!` structs identical to the
// server's (hypercall-rs/perp-api tee_perp.rs, tee_perp_order_batch.rs and the
// directive registry), chain 999.
const DIGESTS = {
  HLOrder: "0x0754a3cfbce5f0ba75c6e11ea5130719718566eebdd36315a74ce18ca9569c02",
  HLCancel: "0xde02378169b499eb80d8d8aead12517553d81e0e0f2234214db1d238407805de",
  HLCancelByCloid: "0x86cc2d186286c741e11b17fd42efd5d255efab9e0db72bbfda7e482e15d13be2",
  HCPerpTriggerOrder: "0x6a23b5ef12c3347e802ab73b08bbecc0ed4e4a42ecef8ea459fdf677f4561280",
  HCPerpOrderBatch: "0x625a60144f057b3ee19d23911ed838e63ca05643f11b9ade2e429f4b0febe197",
  HCPerpLeverageChange: "0x2627f5cb990139c9bbbf20554abdc1ba28bb68b9359a981c91689c0fadf9b542",
  HLAddApiWallet: "0x1f46705220bb1ec0c3b3170336afc3378ec81219caadbff8fd6b903bd07f103f",
} as const;

// deno-lint-ignore no-explicit-any
const digest = (typedData: any) => hashTypedData(typedData);

test("HLOrder digest matches the server schema", () => {
  const action = buildHlLimitOrderAction({
    asset: 3,
    isBuy: true,
    price: "100000",
    size: "0.01",
    tif: "gtc",
    cloid: NONCE,
  });
  assert.deepEqual(action, {
    asset: 3,
    isBuy: true,
    limitPx: "10000000000000",
    sz: "1000000",
    reduceOnly: false,
    encodedTif: 2,
    cloid: "1785672000000",
  });
  const typedData = buildTeePerpLimitOrderTypedData({ account: ACCOUNT, nonce: NONCE, action, chainId: 999 });
  assert.equal(typedData.domain.name, "HypercallApiSign");
  assert.deepEqual(typedData.types.EIP712Domain, DIRECTIVE_DOMAIN_FIELDS);
  assert.equal(digest(typedData), DIGESTS.HLOrder);
});

test("cancel digests match the server schema", () => {
  const byOid = buildTeePerpCancelByOidTypedData({
    account: ACCOUNT,
    nonce: NONCE,
    action: buildHlCancelByOidAction({ asset: 3, oid: 123456789 }),
    chainId: 999,
  });
  assert.equal(digest(byOid), DIGESTS.HLCancel);
  const byCloid = buildTeePerpCancelByCloidTypedData({
    account: ACCOUNT,
    nonce: NONCE,
    action: buildHlCancelByCloidAction({ asset: 3, cloid: "0x19fc2586200" }),
    chainId: 999,
  });
  assert.equal(digest(byCloid), DIGESTS.HLCancelByCloid);
});

test("trigger and bracket batch digests match the server schema", () => {
  const stopLoss = { triggerPrice: "95000", limitPrice: "76000" };
  const trigger = buildTeePerpTriggerOrderWire({
    asset: 3,
    isBuy: false,
    triggerPrice: stopLoss.triggerPrice,
    limitPrice: stopLoss.limitPrice,
    size: "0.01",
    isMarket: true,
    tpsl: "sl",
    reduceOnly: true,
    cloid: deriveTeePerpBatchCloid(NONCE, 0),
  });
  assert.equal(
    digest(buildTeePerpTriggerOrderTypedData({ account: ACCOUNT, nonce: NONCE, order: trigger, chainId: 999 })),
    DIGESTS.HCPerpTriggerOrder,
  );

  const batch = buildTeePerpBracketBatchAction({
    entry: { asset: 3, isBuy: true, price: "100000", size: "0.01", tif: "gtc" },
    takeProfit: { triggerPrice: "110000", limitPrice: "88000" },
    stopLoss,
    nonce: NONCE,
  });
  assert.equal(batch.grouping, "normalTpsl");
  assert.deepEqual(batch.orders.map((order) => order.cloid), [
    String((BigInt(NONCE) << 8n) + 1n),
    String((BigInt(NONCE) << 8n) + 2n),
    String((BigInt(NONCE) << 8n) + 3n),
  ]);
  assert.equal(
    digest(buildTeePerpOrderBatchTypedData({ account: ACCOUNT, nonce: NONCE, batch, chainId: 999 })),
    DIGESTS.HCPerpOrderBatch,
  );
});

test("leverage digest matches the server schema", () => {
  const action = buildTeePerpLeverageAction({ asset: 3, mode: "isolated", leverage: 7 });
  assert.deepEqual(action, { asset: 3, isCross: false, leverage: 7 });
  assert.equal(
    digest(buildTeePerpLeverageTypedData({ account: ACCOUNT, nonce: NONCE, action, chainId: 999 })),
    DIGESTS.HCPerpLeverageChange,
  );
});

test("HLAddApiWallet manager digest matches the server schema", () => {
  const typedData = {
    domain: createHypercallManagerSignDomain(999),
    types: { EIP712Domain: DIRECTIVE_DOMAIN_FIELDS, ...HL_ADD_API_WALLET_TYPES },
    primaryType: "HLAddApiWallet",
    message: {
      account: ACCOUNT,
      nonce: 117025488076800007n,
      action: { apiWalletAddress: "0x2222222222222222222222222222222222222222", apiWalletName: "hypercall-tee" },
    },
  };
  assert.equal(digest(typedData), DIGESTS.HLAddApiWallet);
});

test("an API wallet signature over a batch recovers the signer", async () => {
  const signer = privateKeyToAccount(PRIVATE_KEY);
  const typedData = buildTeePerpOrderBatchTypedData({
    account: ACCOUNT,
    nonce: NONCE,
    batch: buildTeePerpPositionTpslBatchAction({
      asset: 3,
      isBuy: false,
      size: "0.01",
      takeProfit: null,
      stopLoss: { triggerPrice: "95000", limitPrice: "76000" },
      nonce: NONCE,
    }),
    chainId: 998,
  });
  assert.equal(typedData.message.grouping, 2);
  // deno-lint-ignore no-explicit-any
  const signature = await signer.signTypedData(typedData as any);
  // deno-lint-ignore no-explicit-any
  const recovered = await recoverTypedDataAddress({ ...(typedData as any), signature });
  assert.equal(recovered, signer.address);
});

test("limit children sign no trigger; trigger children sign tpsl and TIF 0", () => {
  const scale = buildTeePerpScaleBatchAction({
    asset: 0,
    isBuy: true,
    legs: [{ price: "100", size: "1" }],
    tif: "alo",
    nonce: 5,
  });
  assert.deepEqual(toPerpOrderTerms(scale.orders[0]), {
    asset: 0,
    isBuy: true,
    limitPx: 10_000_000_000n,
    sz: 100_000_000n,
    reduceOnly: false,
    encodedTif: 1,
    triggerPx: 0n,
    isMarket: false,
    tpsl: 0,
    cloid: 1281n,
  });
  const tp = buildTeePerpTriggerOrderWire({
    asset: 0,
    isBuy: false,
    triggerPrice: "110",
    limitPrice: "109",
    size: "1",
    isMarket: false,
    tpsl: "tp",
    cloid: 9,
  });
  const terms = toPerpOrderTerms(tp);
  assert.equal(terms.encodedTif, 0);
  assert.equal(terms.tpsl, 1);
  assert.equal(terms.triggerPx, 11_000_000_000n);
});

test("typed data refuses unsupported chains, zero nonces, and non-trigger trigger orders", () => {
  const action = buildHlLimitOrderAction({ asset: 0, isBuy: true, price: "1", size: "1", tif: "ioc", cloid: 1 });
  assert.throws(() => buildTeePerpLimitOrderTypedData({ account: ACCOUNT, nonce: 1, action, chainId: 1 }));
  assert.throws(() => buildTeePerpLimitOrderTypedData({ account: ACCOUNT, nonce: 0, action, chainId: 999 }));
  const limit = buildTeePerpScaleBatchAction({
    asset: 0,
    isBuy: true,
    legs: [{ price: "1", size: "1" }],
    tif: "gtc",
    nonce: 1,
  }).orders[0];
  assert.throws(() => buildTeePerpTriggerOrderTypedData({ account: ACCOUNT, nonce: 1, order: limit, chainId: 999 }));
  assert.throws(() =>
    buildTeePerpOrderBatchTypedData({
      account: ACCOUNT,
      nonce: 1,
      batch: { orders: [limit, limit], grouping: "na" },
      chainId: 999,
    })
  );
});

test("1e8 scaling, TIF bytes, cloids and oids are validated", () => {
  assert.equal(scalePerpDecimalTo1e8("1.23456789"), "123456789");
  assert.throws(() => scalePerpDecimalTo1e8("0"));
  assert.throws(() => scalePerpDecimalTo1e8("0.000000001"));
  assert.throws(() => scalePerpDecimalTo1e8("184467440738"));
  assert.deepEqual([encodePerpTif("alo"), encodePerpTif("gtc"), encodePerpTif("ioc")], [1, 2, 3]);
  assert.throws(() => buildHlCancelByCloidAction({ asset: 0, cloid: 0 }));
  assert.throws(() => buildHlCancelByCloidAction({ asset: 0, cloid: (1n << 128n).toString() }));
  assert.throws(() => buildHlCancelByOidAction({ asset: 0, oid: 0 }));
  assert.throws(() => deriveTeePerpBatchCloid(1, 255));
});

test("market prices round to Hyperliquid ticks inside the slippage band", () => {
  assert.equal(formatPerpMarketLimitPrice({ referencePrice: "100000", side: "Buy", sizeDecimals: 5 }), "120000");
  assert.equal(formatPerpMarketLimitPrice({ referencePrice: "100000", side: "Sell", sizeDecimals: 5 }), "80000");
  assert.equal(formatPerpMarketLimitPrice({ referencePrice: "1.23456", side: "Buy", sizeDecimals: 0 }), "1.4814");
  assert.equal(formatPerpMarketLimitPrice({ referencePrice: "1.23456", side: "Sell", sizeDecimals: 0 }), "0.98765");
  // No tick inside a zero-width band crosses a reference with too much precision.
  assert.equal(
    formatPerpMarketLimitPrice({ referencePrice: "1.234567", side: "Buy", sizeDecimals: 0, slippageBps: 0 }),
    "",
  );
  assert.equal(formatPerpMarketLimitPrice({ referencePrice: "1", side: "Buy", sizeDecimals: 9 }), "");
  assert.equal(
    resolvePerpTriggerLimitPrice({ kind: "stopMarket", side: "Sell", triggerPrice: "95000", sizeDecimals: 5 }),
    "76000",
  );
  assert.equal(
    resolvePerpTriggerLimitPrice({
      kind: "takeProfitLimit",
      side: "Sell",
      triggerPrice: "110000",
      limitPrice: "109000",
      sizeDecimals: 5,
    }),
    "109000",
  );
  assert.equal(roundPerpPriceToTick("1.234567", "Buy", 2), "1.2345");
  assert.equal(roundPerpPriceToTick("1.234567", "Sell", 2), "1.2346");
});

test("scale legs sum to the total size and respect skew", () => {
  const result = buildPerpScaleOrderLegs({
    startPrice: "100",
    endPrice: "90",
    totalSize: "1",
    orderCount: 3,
    sizeSkew: "2",
    side: "Buy",
    sizeDecimals: 2,
  });
  assert.ok("legs" in result);
  assert.deepEqual(result.legs, [
    { price: "100", size: "0.22" },
    { price: "95", size: "0.33" },
    { price: "90", size: "0.45" },
  ]);
  assert.deepEqual(
    buildPerpScaleOrderLegs({
      startPrice: "100",
      endPrice: "90",
      totalSize: "1",
      orderCount: 101,
      sizeSkew: "1",
      side: "Buy",
      sizeDecimals: 2,
    }),
    { issue: "scaleOrderCount" },
  );
  assert.deepEqual(
    buildPerpScaleOrderLegs({
      startPrice: "100",
      endPrice: "90",
      totalSize: "0.001",
      orderCount: 2,
      sizeSkew: "1",
      side: "Buy",
      sizeDecimals: 2,
    }),
    { issue: "scalePrecision" },
  );
});

test("nonces are stamped on the server clock and stay monotonic", async () => {
  let serverNow = 1_000_000;
  const nonces = new TeePerpNonceManager(() => serverNow);
  assert.equal(await nonces.next(), 1_000_001);
  assert.equal(await nonces.next(), 1_000_002);
  serverNow = 2_000_000;
  const next = await nonces.next();
  assert.equal(next, 2_000_001);
  assert.ok(isTeePerpNonceFresh(next, serverNow));
  assert.ok(!isTeePerpNonceFresh(serverNow - 9_000, serverNow));
  assert.ok(isTeePerpNonceFresh(serverNow + 1_000, serverNow));
  assert.ok(!isTeePerpNonceFresh(serverNow + 1_001, serverNow));
});

test("the server clock reads the /health Date header and caches its offset", async () => {
  assert.equal(serverClockOffsetMs("Thu, 01 Jan 1970 00:00:10 GMT", 1_000, 3_000), 8_500);
  assert.equal(serverClockOffsetMs(null, 0, 1), null);
  let localNow = 1_000;
  let calls = 0;
  const clock = createServerClock({
    apiUrl: "https://api.example.test/base",
    now: () => localNow,
    fetch: (input) => {
      calls += 1;
      assert.equal(String(input), "https://api.example.test/base/health");
      return Promise.resolve(new Response(null, { headers: { date: "Thu, 01 Jan 1970 00:00:10 GMT" } }));
    },
  });
  assert.equal(await clock(), 10_500);
  localNow = 2_000;
  assert.equal(await clock(), 11_500);
  assert.equal(calls, 1);
});

test("builder approval calldata matches the Account ABI", () => {
  const builder = "0x3333333333333333333333333333333333333333";
  assert.equal(
    encodeApproveZeroFeeBuilderCalldata(builder),
    encodeFunctionData({ abi: ACCOUNT_BUILDER_APPROVAL_ABI, functionName: "approveZeroFeeBuilder", args: [builder] }),
  );
  assert.throws(() => encodeApproveZeroFeeBuilderCalldata("0x0000000000000000000000000000000000000000"));
  assert.equal(resolveHypercallBuilderAddress({ hl_builder_address: builder }), builder);
  assert.throws(() => resolveHypercallBuilderAddress({ hl_builder_address: null }), BuilderApprovalRequiredError);
  assert.throws(() => resolveHypercallBuilderAddress({}), BuilderApprovalRequiredError);
});

test("manager authentication message matches the server", () => {
  assert.equal(
    buildHypercallAuthenticationMessage(1704067200),
    "Sign this message to authenticate for Hypercall\nTimestamp: 1704067200",
  );
});

// Shared vectors asserted by the Rust SDK (hypercall-client) too.
test("cross-SDK vectors match the Rust SDK", () => {
  const account = "0x00000000000000000000000000000000000000A1";
  const trigger = buildTeePerpTriggerOrderWire({
    asset: 0,
    isBuy: false,
    triggerPrice: "95000",
    limitPrice: "76000",
    size: "0.01",
    isMarket: true,
    tpsl: "sl",
    reduceOnly: true,
    cloid: deriveTeePerpBatchCloid(NONCE, 0),
  });
  assert.equal(
    digest(buildTeePerpTriggerOrderTypedData({ account, nonce: NONCE, order: trigger, chainId: 999 })),
    "0x8d66674dbca01100f0a0796718b3e36806f4ed060989511fa90dd15df13d5f5d",
  );
  const batch = buildTeePerpBracketBatchAction({
    entry: { asset: 3, isBuy: true, price: "100000", size: "0.01", tif: "gtc" },
    takeProfit: { triggerPrice: "110000", limitPrice: "88000" },
    stopLoss: { triggerPrice: "90000", limitPrice: "72000" },
    nonce: NONCE,
  });
  assert.equal(
    digest(buildTeePerpOrderBatchTypedData({ account, nonce: NONCE, batch, chainId: 999 })),
    "0x5ab3a130019ebf6578451e6982581168da17ce9bac168ecee7365112ab17f951",
  );
  assert.equal(
    digest(
      buildTeePerpLeverageTypedData({
        account,
        nonce: NONCE,
        action: buildTeePerpLeverageAction({ asset: 0, mode: "isolated", leverage: 5 }),
        chainId: 999,
      }),
    ),
    "0xe44c44c973583b2c4701ad0d388a293db3abe4f45058eeb882c2bc428a44cba5",
  );
  assert.equal(
    digest({
      domain: createHypercallManagerSignDomain(999),
      types: { EIP712Domain: DIRECTIVE_DOMAIN_FIELDS, ...HL_ADD_API_WALLET_TYPES },
      primaryType: "HLAddApiWallet",
      message: {
        account,
        nonce: 117025702092800007n,
        action: { apiWalletAddress: "0x00000000000000000000000000000000000000b2", apiWalletName: "hypercall-tee" },
      },
    }),
    "0x680a60d7486c579766782608c78a6fae5c4dbefb782349811bae3cf849295ffc",
  );
});
