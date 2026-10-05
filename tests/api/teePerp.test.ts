import assert from "node:assert/strict";

import openapiFixture from "../fixtures/tee_perp_openapi.json" with { type: "json" };

import { ExchangeClient, InfoClient, ValidationError } from "../../src/mod.ts";
import {
  isBuilderNotApproved,
  PERP_REJECTION_REASON_CODES,
  TEE_PERP_ERROR_CODES,
  teeApiWalletApprovalProgress,
  type TeePerpOrderBatchResponse,
  type TeePerpOrderResponse,
} from "../../src/api/exchange/mod.ts";
import {
  hyperliquidActiveAssetLeverage,
  hyperliquidUserRole,
  isTeeApiWalletActiveForAccount,
  perpPreviewLiquidationUnavailable,
  type TeePerpPreviewResponse,
} from "../../src/api/info/mod.ts";
import {
  buildHlLimitOrderAction,
  buildPerpScaleOrderLegs,
  buildTeePerpBracketBatchAction,
  buildTeePerpScaleBatchAction,
  buildTeePerpTriggerOrderWire,
  deriveTeePerpBatchCloid,
} from "../../src/signing/mod.ts";

type Schema = {
  required?: string[];
  properties?: Record<string, unknown>;
  enum?: string[];
};
// Subset of the server OpenAPI (components.schemas) for the TEE perp routes.
const OPENAPI = openapiFixture as unknown as { schemas: Record<string, Schema> };

function test(name: string, fn: () => void | Promise<void>): void {
  Deno.test(`TEE perp API - ${name}`, fn);
}

type MockCall = { path: string; init: RequestInit };

class MockTransport {
  calls: MockCall[] = [];
  constructor(public response: unknown) {}
  request<T>(path: string, init: RequestInit = {}): Promise<T> {
    this.calls.push({ path, init });
    return Promise.resolve(this.response as T);
  }
}

function body(call: MockCall): Record<string, unknown> {
  return JSON.parse(call.init.body as string);
}

/** A request body must carry every required field and nothing the server's `deny_unknown_fields` rejects. */
function assertMatchesSchema(value: Record<string, unknown>, schemaName: string): void {
  const schema = OPENAPI.schemas[schemaName];
  for (const field of schema.required ?? []) {
    assert.ok(field in value, `${schemaName} requires ${field}`);
  }
  for (const field of Object.keys(value)) {
    assert.ok(field in (schema.properties ?? {}), `${schemaName} has no ${field}`);
  }
}

const ACCOUNT = "0x1111111111111111111111111111111111111111";
const API_WALLET = "0x2222222222222222222222222222222222222222";
const NONCE = 1_785_672_000_000;
const SIGNATURE = `0x${"ab".repeat(65)}`;

const orderResponse: TeePerpOrderResponse = {
  stage: "rejected",
  errorCode: "engine_admission_rejected",
  directiveId: "0190f5a0-0000-7000-8000-000000000001",
  account: ACCOUNT,
  apiWallet: API_WALLET,
  cloid: "0x0000000000000000000001a0fc258620",
  engineSeq: 42,
  venueResponseHash: null,
  message: "Rejected: Insufficient margin: required=10, equity=5, shortfall=5",
  reasonCode: "insufficient_margin",
};

test("error and reason code lists match the server OpenAPI enums", () => {
  assert.deepEqual([...TEE_PERP_ERROR_CODES], OPENAPI.schemas.TeePerpErrorCode.enum);
  assert.deepEqual([...PERP_REJECTION_REASON_CODES], OPENAPI.schemas.PerpRejectionReasonCode.enum);
  assert.equal(TEE_PERP_ERROR_CODES.length, 29);
  assert.equal(PERP_REJECTION_REASON_CODES.length, 16);
  assert.deepEqual(OPENAPI.schemas.TeePerpOrderStage.enum, ["accepted", "rejected", "not_submitted", "unknown"]);
});

test("response fixtures carry every field the OpenAPI marks required", () => {
  const fixtures: Array<[string, Record<string, unknown>]> = [
    ["TeePerpOrderResponse", orderResponse],
    ["TeePerpCancelResponse", {
      stage: "accepted",
      errorCode: null,
      directiveId: "d",
      account: ACCOUNT,
      apiWallet: API_WALLET,
      cloid: "0x01",
      engineSeq: "18446744073709551615",
      venueResponseHash: `0x${"00".repeat(32)}`,
      message: null,
    }],
    ["TeePerpVenueActionResponse", {
      stage: "accepted",
      errorCode: null,
      requestId: "r",
      account: ACCOUNT,
      apiWallet: API_WALLET,
      actionKind: "cancel_by_oid",
      engineSeq: 7,
      venueResponseHash: null,
      message: null,
    }],
    ["TeePerpLeverageResponse", {
      stage: "accepted",
      errorCode: null,
      requestId: "r",
      account: ACCOUNT,
      apiWallet: API_WALLET,
      asset: 3,
      isCross: true,
      leverage: 5,
      engineSeq: null,
      venueResponseHash: null,
      message: null,
      reasonCode: null,
    }],
  ];
  for (const [name, fixture] of fixtures) assertMatchesSchema(fixture, name);
  assert.ok(!isBuilderNotApproved(orderResponse));
  assert.ok(isBuilderNotApproved({ errorCode: "builder_not_approved" }));
});

test("teePerpSubmitOrder posts the signed HlLimitOrderAction", async () => {
  const transport = new MockTransport(orderResponse);
  const client = new ExchangeClient({ transport });
  const action = buildHlLimitOrderAction({
    asset: 3,
    isBuy: true,
    price: "100000",
    size: "0.01",
    tif: "alo",
    cloid: NONCE,
  });
  const response = await client.teePerpSubmitOrder({ account: ACCOUNT, nonce: NONCE, action, signature: SIGNATURE });
  assert.equal(response.reasonCode, "insufficient_margin");
  assert.equal(transport.calls[0].path, "/v1/tee-perp/orders/submit");
  assert.equal(transport.calls[0].init.method, "POST");
  const sent = body(transport.calls[0]);
  assertMatchesSchema(sent, "TeePerpSubmitRequest");
  assert.deepEqual(sent, {
    account: ACCOUNT,
    nonce: NONCE,
    action: {
      asset: 3,
      isBuy: true,
      limitPx: "10000000000000",
      sz: "1000000",
      reduceOnly: false,
      encodedTif: 1,
      cloid: "1785672000000",
    },
    signature: SIGNATURE,
  });
});

test("teePerpSubmitTriggerOrder requires a trigger order type", async () => {
  const batchResponse: TeePerpOrderBatchResponse = {
    stage: "accepted",
    errorCode: null,
    batchId: "b",
    account: ACCOUNT,
    apiWallet: API_WALLET,
    grouping: "na",
    children: [{ directiveId: "c", cloid: "0x01" }],
    engineSeq: 9,
    venueResponseHash: null,
    message: null,
    reasonCode: null,
  };
  assertMatchesSchema(batchResponse, "TeePerpOrderBatchResponse");
  const transport = new MockTransport(batchResponse);
  const client = new ExchangeClient({ transport });
  const order = buildTeePerpTriggerOrderWire({
    asset: 3,
    isBuy: false,
    triggerPrice: "95000",
    limitPrice: "76000",
    size: "0.01",
    isMarket: true,
    tpsl: "sl",
    reduceOnly: true,
    cloid: deriveTeePerpBatchCloid(NONCE, 0),
  });
  await client.teePerpSubmitTriggerOrder({ account: ACCOUNT, nonce: NONCE, action: order, signature: SIGNATURE });
  assert.equal(transport.calls[0].path, "/v1/tee-perp/orders/submit-trigger");
  assertMatchesSchema(body(transport.calls[0]), "TeePerpTriggerSubmitRequest");
  assert.deepEqual((body(transport.calls[0]).action as Record<string, unknown>).orderType, {
    trigger: { triggerPx: "9500000000000", isMarket: true, tpsl: "sl" },
  });

  const limit = buildTeePerpScaleBatchAction({
    asset: 3,
    isBuy: true,
    legs: [{ price: "1", size: "1" }],
    tif: "gtc",
    nonce: NONCE,
  }).orders[0];
  assert.throws(
    () => client.teePerpSubmitTriggerOrder({ account: ACCOUNT, nonce: NONCE, action: limit, signature: SIGNATURE }),
    ValidationError,
  );
});

test("teePerpSubmitOrderBatch sends scale and bracket batches and rejects bad cardinality", async () => {
  const transport = new MockTransport({});
  const client = new ExchangeClient({ transport });
  const legs = buildPerpScaleOrderLegs({
    startPrice: "100",
    endPrice: "90",
    totalSize: "1",
    orderCount: 4,
    sizeSkew: "1",
    side: "Buy",
    sizeDecimals: 2,
  });
  assert.ok("legs" in legs);
  const scale = buildTeePerpScaleBatchAction({ asset: 3, isBuy: true, legs: legs.legs, tif: "gtc", nonce: NONCE });
  await client.teePerpSubmitOrderBatch({ account: ACCOUNT, nonce: NONCE, action: scale, signature: SIGNATURE });
  const sent = body(transport.calls[0]);
  assert.equal(transport.calls[0].path, "/v1/tee-perp/orders/submit-batch");
  assertMatchesSchema(sent, "TeePerpOrderBatchSubmitRequest");
  assert.equal((sent.action as { orders: unknown[] }).orders.length, 4);

  const bracket = buildTeePerpBracketBatchAction({
    entry: { asset: 3, isBuy: true, price: "100000", size: "0.01", tif: "gtc" },
    takeProfit: { triggerPrice: "110000", limitPrice: "88000" },
    stopLoss: null,
    nonce: NONCE,
  });
  await client.teePerpSubmitOrderBatch({ account: ACCOUNT, nonce: NONCE, action: bracket, signature: SIGNATURE });
  assert.equal((body(transport.calls[1]).action as { grouping: string }).grouping, "normalTpsl");

  assert.throws(
    () =>
      client.teePerpSubmitOrderBatch({
        account: ACCOUNT,
        nonce: NONCE,
        action: { orders: [], grouping: "na" },
        signature: SIGNATURE,
      }),
    ValidationError,
  );
  assert.throws(
    () =>
      client.teePerpSubmitOrderBatch({
        account: ACCOUNT,
        nonce: NONCE,
        action: { orders: [scale.orders[0], scale.orders[0]], grouping: "na" },
        signature: SIGNATURE,
      }),
    ValidationError,
  );
});

test("cancels and leverage use their own routes and shapes", async () => {
  const transport = new MockTransport({});
  const client = new ExchangeClient({ transport });
  await client.teePerpCancelByCloid({
    account: ACCOUNT,
    nonce: NONCE,
    action: { asset: 3, cloid: "1785672000000" },
    signature: SIGNATURE,
  });
  await client.teePerpCancelByOid({
    account: ACCOUNT,
    nonce: NONCE,
    action: { asset: 3, oid: 123456789 },
    signature: SIGNATURE,
  });
  await client.teePerpUpdateLeverage({
    account: ACCOUNT,
    nonce: NONCE,
    action: { asset: 3, isCross: false, leverage: 7 },
    signature: SIGNATURE,
  });
  assert.deepEqual(transport.calls.map((call) => call.path), [
    "/v1/tee-perp/cancels/submit",
    "/v1/tee-perp/cancels/submit-by-oid",
    "/v1/tee-perp/leverage/submit",
  ]);
  assertMatchesSchema(body(transport.calls[0]), "TeePerpCancelSubmitRequest");
  assertMatchesSchema(body(transport.calls[1]), "TeePerpCancelByOidSubmitRequest");
  assertMatchesSchema(body(transport.calls[2]), "TeePerpLeverageSubmitRequest");
  assert.deepEqual(body(transport.calls[1]).action, { asset: 3, oid: "123456789" });
  assert.throws(
    () =>
      client.teePerpCancelByCloid({
        account: ACCOUNT,
        nonce: NONCE,
        action: { asset: 3, cloid: "0" },
        signature: SIGNATURE,
      }),
    ValidationError,
  );
  assert.throws(
    () =>
      client.teePerpUpdateLeverage({
        account: ACCOUNT,
        nonce: NONCE,
        action: { asset: 3, isCross: true, leverage: 0 },
        signature: SIGNATURE,
      }),
    ValidationError,
  );
});

test("TEE API wallet enrollment requests match the server schemas", async () => {
  const transport = new MockTransport({});
  const client = new ExchangeClient({ transport });
  await client.teeApiWalletApprovalRequest({
    account: ACCOUNT,
    manager: API_WALLET,
    timestamp: 1785672000,
    signature: SIGNATURE,
  });
  await client.teeApiWalletApprovalSubmit({
    account: ACCOUNT,
    manager: API_WALLET,
    timestamp: 1785672000,
    authenticationSignature: SIGNATURE,
    teeWalletId: `0x${"22".repeat(32)}`,
    nonce: "117025488076800007",
    signature: SIGNATURE,
  });
  assert.equal(transport.calls[0].path, "/v1/tee-api-wallet/approval-request");
  assert.equal(transport.calls[1].path, "/v1/tee-api-wallet/approval");
  assertMatchesSchema(body(transport.calls[0]), "ApprovalRequest");
  assertMatchesSchema(body(transport.calls[1]), "ApprovalSubmitRequest");
  assert.equal(body(transport.calls[1]).nonce, "117025488076800007");

  assert.equal(teeApiWalletApprovalProgress({ domain_status: "completed", delivery_status: "finalized" }), "finalized");
  assert.equal(teeApiWalletApprovalProgress({ domain_status: "accepted", delivery_status: "dead_lettered" }), "failed");
  assert.equal(teeApiWalletApprovalProgress({ domain_status: "rejected", delivery_status: "pending" }), "failed");
  assert.equal(teeApiWalletApprovalProgress({ domain_status: "accepted", delivery_status: "included" }), "pending");
});

test("teePerpPreview posts every supported action kind and returns the envelope", async () => {
  const preview: TeePerpPreviewResponse = {
    success: true,
    data: {
      decision: "rejected",
      reasonCode: "insufficient_margin",
      reason: "Rejected: Insufficient margin",
      margin: {
        equity: "5",
        initialRequiredBefore: "0",
        initialRequiredAfter: "10",
        initialAvailableAfter: "-5",
        maintenanceRequiredAfter: "4",
        shortfall: "5",
      },
      liquidationPxBefore: null,
      liquidationPxAfter: "81234.5",
      liquidationBinding: "portfolio_margin",
      venueLiquidation: { enforced: false, compartments: [] },
      maxSize: { sz: "0.004", notional: "400" },
      notes: ["Liquidation price input unavailable: venue observation is stale"],
    },
    error: null,
  };
  assertMatchesSchema(preview.data as unknown as Record<string, unknown>, "PerpPreviewResponse");
  assertMatchesSchema(preview.data!.margin as unknown as Record<string, unknown>, "PerpPreviewMargin");
  assert.ok(perpPreviewLiquidationUnavailable(preview.data!));

  const transport = new MockTransport(preview);
  const info = new InfoClient({ transport });
  const result = await info.teePerpPreview({
    account: ACCOUNT,
    action: {
      kind: "order",
      asset: 3,
      isBuy: true,
      limitPx: "100000",
      sz: "0.01",
      orderType: { limit: { tif: "Gtc" } },
    },
  });
  assert.equal(result.data?.liquidationBinding, "portfolio_margin");
  await info.teePerpPreview({
    account: ACCOUNT,
    action: {
      kind: "order_batch",
      grouping: "normalTpsl",
      orders: [
        { asset: 3, isBuy: true, limitPx: "100000", sz: "0.01", orderType: { limit: { tif: "Ioc" } } },
        {
          asset: 3,
          isBuy: false,
          limitPx: "76000",
          sz: "0.01",
          reduceOnly: true,
          orderType: { trigger: { triggerPx: "95000", isMarket: true, tpsl: "sl" } },
        },
      ],
      leverage: { isCross: true, value: 5 },
    },
  });
  await info.teePerpPreview({ account: ACCOUNT, action: { kind: "leverage", asset: 3, isCross: false, leverage: 3 } });
  assert.ok(transport.calls.every((call) => call.path === "/v1/tee-perp/preview"));
  for (const call of transport.calls) assertMatchesSchema(body(call), "PerpPreviewRequest");
  assert.deepEqual(body(transport.calls[0]).action, {
    kind: "order",
    asset: 3,
    isBuy: true,
    limitPx: "100000",
    sz: "0.01",
    reduceOnly: false,
    orderType: { limit: { tif: "Gtc" } },
  });
  assert.throws(
    () =>
      info.teePerpPreview({
        account: ACCOUNT,
        // @ts-expect-error TWAP has no submit route, so the SDK does not preview it.
        action: { kind: "twap", asset: 3, isBuy: true, sz: "1" },
      }),
    ValidationError,
  );
  assert.throws(
    () =>
      info.teePerpPreview({
        account: ACCOUNT,
        action: { kind: "order", asset: 3, isBuy: true, limitPx: "0", sz: "1", orderType: { limit: { tif: "Gtc" } } },
      }),
    ValidationError,
  );
});

test("teePerpMarkets reads the support list", async () => {
  const fixture = {
    markets: [
      {
        assetId: 110000,
        symbol: "SNDK-PERP",
        underlying: "SNDK",
        hyperliquidCoin: "xyz:SNDK",
        dex: "xyz",
        supported: false,
        reasonCode: "market_not_supported",
        missing: "price_source",
        message: "perp asset 110000 (SNDK-PERP) has no engine spot price for its underlying",
      },
    ],
  };
  assertMatchesSchema(fixture, "TeePerpMarketsResponse");
  assertMatchesSchema(fixture.markets[0], "TeePerpMarketEntry");
  const transport = new MockTransport(fixture);
  const markets = await new InfoClient({ transport }).teePerpMarkets();
  assert.equal(markets.markets[0].hyperliquidCoin, "xyz:SNDK");
  assert.equal(transport.calls[0].path, "/v1/tee-perp/markets");
});

test("Hyperliquid userRole and activeAssetData readbacks", async () => {
  const role = { role: "agent", data: { user: ACCOUNT.toUpperCase().replace("0X", "0x") } };
  const roleTransport = new MockTransport(role);
  const result = await hyperliquidUserRole({ transport: roleTransport }, { user: API_WALLET });
  assert.deepEqual(body(roleTransport.calls[0]), { type: "userRole", user: API_WALLET });
  assert.ok(isTeeApiWalletActiveForAccount(result, ACCOUNT));
  assert.ok(!isTeeApiWalletActiveForAccount({ role: "user" }, ACCOUNT));
  assert.ok(!isTeeApiWalletActiveForAccount({ role: "agent", data: { user: API_WALLET } }, ACCOUNT));

  const leverageTransport = new MockTransport({
    user: ACCOUNT,
    coin: "BTC",
    leverage: { type: "isolated", value: 7, rawUsd: "-100" },
  });
  const leverage = await hyperliquidActiveAssetLeverage({ transport: leverageTransport }, {
    user: ACCOUNT,
    coin: "BTC",
  });
  assert.deepEqual(leverage, { mode: "isolated", value: 7 });
  assert.deepEqual(body(leverageTransport.calls[0]), { type: "activeAssetData", user: ACCOUNT, coin: "BTC" });

  const wrongCoin = new MockTransport({ user: ACCOUNT, coin: "ETH", leverage: { type: "cross", value: 3 } });
  await assert.rejects(() => hyperliquidActiveAssetLeverage({ transport: wrongCoin }, { user: ACCOUNT, coin: "BTC" }));
});
