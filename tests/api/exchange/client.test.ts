import assert from "node:assert/strict";

import {
  ExchangeClient,
  type PlaceOrderResponse,
  type ReplaceOrderResponse,
  ValidationError,
} from "../../../src/mod.ts";
import {
  acceptRfqQuote,
  approveAgent,
  bulkCancelOrders,
  bulkCancelOrdersByClientId,
  cancelOrder,
  cancelOrderByClientId,
  createReferralCode,
  placeOrder,
  replaceOrder,
  revokeAgent,
  revokeAllAgents,
  setMarginMode,
  setReferrer,
  setSettlementPayoutsSeen,
  submitRfq,
  submitStandardMarginLiquidation,
  withdrawUsdc,
} from "../../../src/api/exchange/mod.ts";

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
const SIGNER = "0xAB7Bab0e4c09Ff447863f507C16090A9A02792d2";
const LOWER_SIGNER = SIGNER.toLowerCase();
const LIQUIDATED_WALLET = "0x1111111111111111111111111111111111111111";
const DESTINATION_WALLET = "0x2222222222222222222222222222222222222222";

type MockCall = {
  path: string;
  init: RequestInit;
  signal?: AbortSignal;
};

class MockTransport {
  calls: MockCall[] = [];
  response: unknown;

  constructor(response: unknown = { ok: true }) {
    this.response = response;
  }

  request<TResponse = unknown>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<TResponse> {
    this.calls.push({ path, init, signal });
    return Promise.resolve(this.response as TResponse);
  }
}

function createClient(response: unknown = { ok: true }): {
  client: ExchangeClient;
  transport: MockTransport;
} {
  const transport = new MockTransport(response);
  return {
    client: new ExchangeClient({ transport }),
    transport,
  };
}

function parseBody(call: MockCall): unknown {
  if (typeof call.init.body !== "string") {
    throw new TypeError("Expected JSON request body");
  }
  return JSON.parse(call.init.body);
}

describe("ExchangeClient", () => {
  test("approveAgent sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      error: null,
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.approveAgent(
      {
        agent: SIGNER,
        nonce: 123,
        signature: "0xsignature",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/approve-agent");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      agent: SIGNER,
      signature: "0xsignature",
      nonce: 123,
    });
  });

  test("approveAgent accepts the frontend common signed payload shape", async () => {
    const { client, transport } = createClient({
      success: true,
      error: null,
    });

    await client.approveAgent({
      wallet: WALLET,
      agent: SIGNER,
      nonce: 123,
      signature: "0xsignature",
    } as never);

    assert.deepEqual(parseBody(transport.calls[0]), {
      agent: SIGNER,
      signature: "0xsignature",
      nonce: 123,
    });
  });

  test("revokeAgent sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      error: null,
    };
    const { client, transport } = createClient(response);

    const result = await client.revokeAgent({
      agent: SIGNER,
      nonce: 123,
      signature: "0xsignature",
    });

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/revoke-agent");
    assert.equal(call.init.method, "DELETE");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      agent: SIGNER,
      signature: "0xsignature",
      nonce: 123,
    });
  });

  test("revokeAllAgents sends the expected pre-signed request", async () => {
    const response = { success: true, error: null };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.revokeAllAgents(
      { nonce: 124, signature: "0xsignature" },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.deepEqual(transport.calls, [{
      path: "/revoke-all-agents",
      init: {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nonce: 124, signature: "0xsignature" }),
      },
      signal: controller.signal,
    }]);
  });

  test("referral writes send the expected pre-signed requests", async () => {
    const { client, transport } = createClient();

    await client.createReferralCode({
      wallet: WALLET,
      code: "ALPHA",
      nonce: 125,
      signature: "0xsignature",
    });
    await client.setReferrer({
      wallet: WALLET,
      code: "ALPHA",
      referrer: SIGNER,
      nonce: 126,
      signature: "0xsignature",
    });

    assert.equal(transport.calls[0].path, "/referrals/code");
    assert.equal(transport.calls[0].init.method, "POST");
    assert.deepEqual(parseBody(transport.calls[0]), {
      wallet: LOWER_WALLET,
      code: "ALPHA",
      nonce: 125,
      signature: "0xsignature",
    });
    assert.equal(transport.calls[1].path, "/referrals/set-referrer");
    assert.equal(transport.calls[1].init.method, "POST");
    assert.deepEqual(parseBody(transport.calls[1]), {
      wallet: LOWER_WALLET,
      code: "ALPHA",
      referrer: SIGNER,
      nonce: 126,
      signature: "0xsignature",
    });
  });

  test("low-level agent exports send the same requests", async () => {
    const transport = new MockTransport();

    await approveAgent({ transport }, {
      agent: SIGNER,
      nonce: 456,
      signature: "0xsignature",
    });
    await revokeAgent({ transport }, {
      agent: SIGNER,
      nonce: 789,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 2);
    assert.equal(transport.calls[0].path, "/approve-agent");
    assert.equal(transport.calls[0].init.method, "POST");
    assert.equal(transport.calls[1].path, "/revoke-agent");
    assert.equal(transport.calls[1].init.method, "DELETE");
  });

  test("cancelOrder sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      data: null,
      error: null,
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.cancelOrder(
      {
        wallet: WALLET,
        order_id: 123,
        nonce: 456,
        signature: "0xsignature",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/order");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "DELETE");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      order_id: 123,
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 456,
    });
  });

  test("cancelOrderByClientId sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      data: null,
      error: null,
    };
    const { client, transport } = createClient(response);

    const result = await client.cancelOrderByClientId({
      wallet: WALLET,
      client_id: "client-123",
      nonce: 456,
      signature: "0xsignature",
    });

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/order_cloid");
    assert.equal(call.init.method, "DELETE");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      client_id: "client-123",
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 456,
    });
  });

  test("bulkCancelOrders sends the expected pre-signed request", async () => {
    const response = {
      results: [
        {
          index: 0,
          success: true,
          data: null,
          error: null,
        },
      ],
    };
    const { client, transport } = createClient(response);

    const result = await client.bulkCancelOrders({
      cancels: [
        {
          wallet: WALLET,
          order_id: 123,
          nonce: 456,
          signature: "0xsignature",
        },
        {
          wallet: SIGNER,
          order_id: 124,
          nonce: 457,
          signature: "0xsignature2",
        },
      ],
    });

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/bulk_order");
    assert.equal(call.init.method, "DELETE");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      cancels: [
        {
          order_id: 123,
          wallet: LOWER_WALLET,
          signature: "0xsignature",
          nonce: 456,
        },
        {
          order_id: 124,
          wallet: LOWER_SIGNER,
          signature: "0xsignature2",
          nonce: 457,
        },
      ],
    });
  });

  test("bulkCancelOrdersByClientId sends the expected pre-signed request", async () => {
    const response = {
      results: [
        {
          index: 0,
          success: true,
          data: null,
          error: null,
        },
      ],
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.bulkCancelOrdersByClientId(
      {
        cancels: [
          {
            wallet: WALLET,
            client_id: "client-123",
            nonce: 456,
            signature: "0xsignature",
          },
          {
            wallet: SIGNER,
            client_id: "client-124",
            nonce: 457,
            signature: "0xsignature2",
          },
        ],
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/bulk_order_cloid");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "DELETE");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      cancels: [
        {
          client_id: "client-123",
          wallet: LOWER_WALLET,
          signature: "0xsignature",
          nonce: 456,
        },
        {
          client_id: "client-124",
          wallet: LOWER_SIGNER,
          signature: "0xsignature2",
          nonce: 457,
        },
      ],
    });
  });

  test("low-level cancel exports send the same requests", async () => {
    const transport = new MockTransport();

    await cancelOrder({ transport }, {
      wallet: WALLET,
      order_id: 123,
      nonce: 456,
      signature: "0xsignature",
    });
    await cancelOrderByClientId({ transport }, {
      wallet: WALLET,
      client_id: "client-123",
      nonce: 457,
      signature: "0xsignature",
    });
    await bulkCancelOrders({ transport }, {
      cancels: [{
        wallet: WALLET,
        order_id: 124,
        nonce: 458,
        signature: "0xsignature",
      }],
    });
    await bulkCancelOrdersByClientId({ transport }, {
      cancels: [{
        wallet: WALLET,
        client_id: "client-124",
        nonce: 459,
        signature: "0xsignature",
      }],
    });

    assert.equal(transport.calls.length, 4);
    assert.equal(transport.calls[0].path, "/order");
    assert.equal(transport.calls[0].init.method, "DELETE");
    assert.equal(transport.calls[1].path, "/order_cloid");
    assert.equal(transport.calls[1].init.method, "DELETE");
    assert.equal(transport.calls[2].path, "/bulk_order");
    assert.equal(transport.calls[2].init.method, "DELETE");
    assert.equal(transport.calls[3].path, "/bulk_order_cloid");
    assert.equal(transport.calls[3].init.method, "DELETE");
  });

  test("placeOrder sends the expected pre-signed request", async () => {
    const response = {
      timestamp: 1,
      info: {
        symbol: "BTC-30JUN26-100000-C",
        price: "100",
        size: "0.1",
        side: "Buy",
        tif: "gtc",
        client_id: "client-123",
        order_id: 123,
        is_perp: false,
        underlying: null,
        reduce_only: null,
        nonce: 456,
        signature: null,
        mmp_enabled: true,
        builder_code_address: SIGNER,
      },
      status: "OPEN",
      reason: null,
      filled_size: "0",
      order_id: 123,
      wallet_address: LOWER_WALLET,
      mmp_triggered: false,
    } satisfies PlaceOrderResponse;
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.placeOrder(
      {
        wallet: WALLET,
        symbol: "BTC-30JUN26-100000-C",
        side: "Buy",
        size: "0.1",
        price: "100",
        tif: "gtc",
        route: "best_execution",
        client_id: "client-123",
        nonce: 456,
        signature: "0xsignature",
        reduce_only: true,
        mmp_enabled: true,
        builder_code_address: SIGNER,
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/order");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      symbol: "BTC-30JUN26-100000-C",
      side: "Buy",
      size: "0.1",
      price: "100",
      tif: "gtc",
      route: "best_execution",
      client_id: "client-123",
      mmp_enabled: true,
      builder_code_address: SIGNER,
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 456,
      reduce_only: true,
    });
  });

  test("replaceOrder sends the expected pre-signed request", async () => {
    const response = {
      timestamp: 1,
      info: {
        symbol: "BTC-30JUN26-100000-C",
        price: "101",
        size: "0.1",
        side: "Buy",
        tif: "gtc",
        client_id: "client-124",
        order_id: 123,
        is_perp: false,
        underlying: null,
        reduce_only: null,
        nonce: 457,
        signature: null,
        mmp_enabled: false,
        builder_code_address: null,
      },
      status: "OPEN",
      reason: null,
      filled_size: "0",
      order_id: 124,
      wallet_address: LOWER_WALLET,
      mmp_triggered: false,
    } satisfies ReplaceOrderResponse;
    const { client, transport } = createClient(response);

    const result = await client.replaceOrder({
      wallet: WALLET,
      order_id: 123,
      symbol: "BTC-30JUN26-100000-C",
      side: "Buy",
      size: "0.1",
      price: "101",
      tif: "gtc",
      client_id: "",
      nonce: 457,
      signature: "0xsignature",
      reduce_only: true,
      builder_code_address: null,
    });

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/order");
    assert.equal(call.init.method, "PUT");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      order_id: 123,
      symbol: "BTC-30JUN26-100000-C",
      side: "Buy",
      size: "0.1",
      price: "101",
      tif: "gtc",
      client_id: "",
      builder_code_address: null,
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 457,
      reduce_only: true,
    });
  });

  test("low-level order write exports send the same requests", async () => {
    const transport = new MockTransport();

    await placeOrder({ transport }, {
      wallet: WALLET,
      symbol: "BTC-30JUN26-100000-C",
      side: "Buy",
      size: "0.1",
      price: "100",
      tif: "gtc",
      route: "best_execution",
      nonce: 456,
      signature: "0xsignature",
    });
    await replaceOrder({ transport }, {
      wallet: WALLET,
      order_id: 123,
      symbol: "BTC-30JUN26-100000-C",
      side: "Sell",
      size: "0.2",
      price: "99",
      tif: "ioc",
      nonce: 457,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 2);
    assert.equal(transport.calls[0].path, "/order");
    assert.equal(transport.calls[0].init.method, "POST");
    assert.equal(transport.calls[1].path, "/order");
    assert.equal(transport.calls[1].init.method, "PUT");
  });

  test("low-level identity write exports send the same requests", async () => {
    const transport = new MockTransport();

    await revokeAllAgents({ transport }, { nonce: 456, signature: "0xsignature" });
    await createReferralCode({ transport }, {
      wallet: WALLET,
      code: "ALPHA",
      nonce: 457,
      signature: "0xsignature",
    });
    await setReferrer({ transport }, {
      wallet: WALLET,
      code: "ALPHA",
      referrer: SIGNER,
      nonce: 458,
      signature: "0xsignature",
    });

    assert.deepEqual(transport.calls.map((call) => [call.path, call.init.method]), [
      ["/revoke-all-agents", "DELETE"],
      ["/referrals/code", "POST"],
      ["/referrals/set-referrer", "POST"],
    ]);
  });

  test("setMarginMode sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      data: {
        wallet: LOWER_WALLET,
        margin_mode: "standard",
        previous_mode: "portfolio",
      },
      error: null,
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.setMarginMode(
      {
        wallet: WALLET,
        margin_mode: "standard",
        nonce: 456,
        signature: "0xsignature",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/margin-mode");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      margin_mode: "standard",
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 456,
    });
  });

  test("low-level setMarginMode export sends the same request", async () => {
    const transport = new MockTransport();

    await setMarginMode({ transport }, {
      wallet: WALLET,
      margin_mode: "portfolio",
      nonce: 456,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 1);
    assert.equal(transport.calls[0].path, "/margin-mode");
    assert.deepEqual(parseBody(transport.calls[0]), {
      margin_mode: "portfolio",
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 456,
    });
  });

  test("setSettlementPayoutsSeen sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      requested: 3,
      affected: 2,
      error: null,
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.setSettlementPayoutsSeen(
      {
        wallet: WALLET,
        ids: [5, 2, 2],
        nonce: 123,
        signature: "0xsignature",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/settlement-payouts/seen");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      ids: [5, 2, 2],
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 123,
    });
  });

  test("low-level setSettlementPayoutsSeen export sends the same request", async () => {
    const transport = new MockTransport();

    await setSettlementPayoutsSeen({ transport }, {
      wallet: WALLET,
      ids: [123],
      nonce: 456,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 1);
    assert.equal(transport.calls[0].path, "/settlement-payouts/seen");
    assert.deepEqual(parseBody(transport.calls[0]), {
      ids: [123],
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 456,
    });
  });

  test("withdrawUsdc sends the expected owner-signed request", async () => {
    const response = {
      success: true,
      request_id: "withdrawal-1",
      directive_id: "directive-1",
      domain_status: "queued",
      delivery_status: "pending",
      balance_after: "100.5",
      message: "USDC withdrawal accepted",
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.withdrawUsdc(
      {
        wallet: WALLET,
        account: LOWER_WALLET,
        destination: DESTINATION_WALLET,
        amount: "25.5",
        nonce: 789,
        signature: "0xsignature",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/withdraw/usdc");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      account: LOWER_WALLET,
      destination: DESTINATION_WALLET,
      amount: "25.5",
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 789,
    });
  });

  test("low-level withdrawUsdc export sends the same request", async () => {
    const transport = new MockTransport();

    await withdrawUsdc({ transport }, {
      wallet: WALLET,
      account: LOWER_WALLET,
      destination: DESTINATION_WALLET,
      amount: "25.5",
      nonce: 789,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 1);
    assert.equal(transport.calls[0].path, "/withdraw/usdc");
    assert.equal(transport.calls[0].init.method, "POST");
  });

  test("submitRfq sends the expected pre-signed request", async () => {
    const response = {
      rfq_id: "00000000-0000-0000-0000-000000000000",
      status: "sent_to_qps",
      underlying: "BTC",
      legs: [{ instrument: "BTC-30JUN26-100000-C", side: "Buy", size: "0.1" }],
      quotes: [],
      created_at: 1,
      expires_at: 2,
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.submitRfq(
      {
        rfq_id: "00000000-0000-0000-0000-000000000000",
        legs: [{ instrument: "BTC-30JUN26-100000-C", side: "Buy", size: "0.1" }],
        wallet_address: WALLET,
        nonce: 123,
        signature: "0xsignature",
        auto_accept_limit: "10",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/rfq/request");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      rfq_id: "00000000-0000-0000-0000-000000000000",
      legs: [{ instrument: "BTC-30JUN26-100000-C", side: "Buy", size: "0.1" }],
      wallet_address: WALLET,
      nonce: 123,
      signature: "0xsignature",
      auto_accept_limit: "10",
    });
  });

  test("acceptRfqQuote sends the expected pre-signed request", async () => {
    const response = {
      rfq_id: "00000000-0000-0000-0000-000000000000",
      quote_id: "11111111-1111-1111-1111-111111111111",
      status: "executed",
      fill_id: "fill-1",
    };
    const { client, transport } = createClient(response);

    const result = await client.acceptRfqQuote({
      rfq_id: "00000000-0000-0000-0000-000000000000",
      quote_id: "11111111-1111-1111-1111-111111111111",
      wallet_address: WALLET,
      nonce: 124,
      signature: "0xsignature",
    });

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/rfq/accept");
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      rfq_id: "00000000-0000-0000-0000-000000000000",
      quote_id: "11111111-1111-1111-1111-111111111111",
      wallet_address: WALLET,
      nonce: 124,
      signature: "0xsignature",
    });
  });

  test("low-level RFQ exports send the same requests", async () => {
    const transport = new MockTransport();

    await submitRfq({ transport }, {
      rfq_id: "00000000-0000-0000-0000-000000000000",
      legs: [{ instrument: "BTC-30JUN26-100000-C", side: "Sell", size: "0.2" }],
      wallet_address: WALLET,
      nonce: 456,
      signature: "0xsignature",
    });

    await acceptRfqQuote({ transport }, {
      rfq_id: "00000000-0000-0000-0000-000000000000",
      quote_id: "11111111-1111-1111-1111-111111111111",
      wallet_address: WALLET,
      nonce: 457,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 2);
    assert.equal(transport.calls[0].path, "/rfq/request");
    assert.equal(transport.calls[0].init.method, "POST");
    assert.equal(transport.calls[1].path, "/rfq/accept");
    assert.equal(transport.calls[1].init.method, "POST");
  });

  test("submitStandardMarginLiquidation sends the expected pre-signed request", async () => {
    const response = {
      success: true,
      data: {
        request_id: "00000000-0000-0000-0000-000000000000",
        auction_id: "auction-1",
        liquidated_wallet: LIQUIDATED_WALLET,
        liquidator_wallet: LOWER_WALLET,
      },
      error: null,
    };
    const { client, transport } = createClient(response);
    const controller = new AbortController();

    const result = await client.submitStandardMarginLiquidation(
      {
        wallet: WALLET,
        liquidated_wallet: LIQUIDATED_WALLET,
        request_id: "00000000-0000-0000-0000-000000000000",
        auction_id: "auction-1",
        bid_usdc: "100",
        positions: [{ symbol: "BTC-30JUN26-100000-C", quantity: "1", entry_price: "10" }],
        portfolio_hash: "0xportfolio",
        auction_terms_hash: "0xterms",
        auction_version: 2,
        valuation_timestamp_ms: 123456,
        bid_intent_hash: "intent-1",
        nonce: 125,
        signature: "0xsignature",
      },
      { signal: controller.signal },
    );

    assert.equal(result, response);
    assert.equal(transport.calls.length, 1);

    const call = transport.calls[0];
    assert.equal(call.path, "/liquidation/standard-margin");
    assert.equal(call.signal, controller.signal);
    assert.equal(call.init.method, "POST");
    assert.deepEqual(call.init.headers, {
      "content-type": "application/json",
    });
    assert.deepEqual(parseBody(call), {
      liquidated_wallet: LIQUIDATED_WALLET,
      request_id: "00000000-0000-0000-0000-000000000000",
      auction_id: "auction-1",
      bid_usdc: "100",
      positions: [{ symbol: "BTC-30JUN26-100000-C", quantity: "1", entry_price: "10" }],
      portfolio_hash: "0xportfolio",
      auction_terms_hash: "0xterms",
      auction_version: 2,
      valuation_timestamp_ms: 123456,
      bid_intent_hash: "intent-1",
      wallet: LOWER_WALLET,
      signature: "0xsignature",
      nonce: 125,
    });
  });

  test("low-level standard-margin liquidation export sends the same request", async () => {
    const transport = new MockTransport();

    await submitStandardMarginLiquidation({ transport }, {
      wallet: WALLET,
      liquidated_wallet: LIQUIDATED_WALLET,
      request_id: "00000000-0000-0000-0000-000000000000",
      auction_id: "auction-1",
      bid_usdc: "100",
      positions: [{ symbol: "BTC-30JUN26-100000-C", quantity: "1", entry_price: "10" }],
      portfolio_hash: "0xportfolio",
      auction_terms_hash: "0xterms",
      auction_version: 2,
      valuation_timestamp_ms: 123456,
      bid_intent_hash: "intent-1",
      nonce: 125,
      signature: "0xsignature",
    });

    assert.equal(transport.calls.length, 1);
    assert.equal(transport.calls[0].path, "/liquidation/standard-margin");
    assert.equal(transport.calls[0].init.method, "POST");
  });

  test("validates parameters before sending a request", () => {
    const { client, transport } = createClient();

    assert.throws(
      () =>
        client.approveAgent({
          agent: "not-a-wallet",
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.revokeAgent({
          agent: SIGNER,
          nonce: -1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.cancelOrder({
          wallet: WALLET,
          order_id: 0,
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.cancelOrderByClientId({
          wallet: WALLET,
          client_id: "",
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.placeOrder({
          wallet: WALLET,
          symbol: "BTC-30JUN26-100000-C",
          side: "buy",
          size: "0.1",
          price: "100",
          tif: "gtc",
          nonce: 1,
          signature: "0xsignature",
        } as never),
      ValidationError,
    );

    assert.throws(
      () =>
        client.replaceOrder({
          wallet: WALLET,
          order_id: 0,
          symbol: "BTC-30JUN26-100000-C",
          side: "Buy",
          size: "0.1",
          price: "100",
          tif: "gtc",
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.setMarginMode({
          wallet: WALLET,
          margin_mode: "cross",
          nonce: 1,
          signature: "0xsignature",
        } as never),
      ValidationError,
    );

    assert.throws(
      () =>
        client.bulkCancelOrders({
          cancels: [],
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.bulkCancelOrders({
          cancels: Array.from({ length: 51 }, (_, index) => ({
            wallet: WALLET,
            order_id: index + 1,
            nonce: index + 1,
            signature: "0xsignature",
          })),
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.bulkCancelOrdersByClientId({
          cancels: [],
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.bulkCancelOrdersByClientId({
          cancels: Array.from({ length: 51 }, (_, index) => ({
            wallet: WALLET,
            client_id: `client-${index}`,
            nonce: index + 1,
            signature: "0xsignature",
          })),
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.setSettlementPayoutsSeen({
          wallet: "not-a-wallet",
          ids: [1],
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.setSettlementPayoutsSeen({
          wallet: WALLET,
          ids: [],
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.setSettlementPayoutsSeen({
          wallet: WALLET,
          ids: [1, 0],
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.submitRfq({
          rfq_id: "00000000-0000-0000-0000-000000000000",
          legs: [],
          wallet_address: WALLET,
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.withdrawUsdc({
          wallet: WALLET,
          account: "not-a-wallet",
          destination: DESTINATION_WALLET,
          amount: "25.5",
          nonce: 789,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.submitRfq({
          rfq_id: "00000000-0000-0000-0000-000000000000",
          legs: [{ instrument: "BTC-30JUN26-100000-C", side: "buy", size: "0.1" }],
          wallet_address: WALLET,
          nonce: 1,
          signature: "0xsignature",
        } as never),
      ValidationError,
    );

    assert.throws(
      () =>
        client.acceptRfqQuote({
          rfq_id: "00000000-0000-0000-0000-000000000000",
          quote_id: "",
          wallet_address: WALLET,
          nonce: 1,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.throws(
      () =>
        client.submitStandardMarginLiquidation({
          wallet: WALLET,
          liquidated_wallet: LIQUIDATED_WALLET,
          request_id: "00000000-0000-0000-0000-000000000000",
          auction_id: "auction-1",
          bid_usdc: "100",
          positions: [],
          portfolio_hash: "0xportfolio",
          auction_terms_hash: "0xterms",
          auction_version: 2,
          valuation_timestamp_ms: 123456,
          bid_intent_hash: "intent-1",
          nonce: 125,
          signature: "0xsignature",
        }),
      ValidationError,
    );

    assert.deepEqual(transport.calls, []);
  });
});
