import assert from "node:assert/strict";

import { InfoClient, ValidationError } from "../../../src/mod.ts";

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
  client: InfoClient;
  transport: MockTransport;
} {
  const transport = new MockTransport(response);
  return {
    client: new InfoClient({ transport }),
    transport,
  };
}

describe("InfoClient", () => {
  const cases: Array<{
    name: string;
    call: (client: InfoClient, signal: AbortSignal) => Promise<unknown>;
    path: string;
    init?: RequestInit;
  }> = [
    {
      name: "markets",
      call: (client, signal) => client.markets(signal),
      path: "/markets",
    },
    {
      name: "markets without instruments",
      call: (client, signal) => client.markets({ include_instruments: false }, signal),
      path: "/markets?include_instruments=false",
    },
    {
      name: "exchangeInfo",
      call: (client, signal) => client.exchangeInfo(signal),
      path: "/exchange-info",
    },
    {
      name: "instruments",
      call: (client, signal) => client.instruments({ currency: "SPCX" }, signal),
      path: "/instruments?currency=SPCX&kind=option",
    },
    {
      name: "optionSummaries",
      call: (client, signal) => client.optionSummaries({ currency: "SPCX", expiry: 1782432000 }, signal),
      path: "/options-summary?currency=SPCX&kind=option&expiry=1782432000",
    },
    {
      name: "optionSummaries with RFQ provider quotes",
      call: (client, signal) =>
        client.optionSummaries({
          currency: "SPCX",
          includeRfqProviderQuotes: true,
          rfqProviderQuotesLimit: 5,
        }, signal),
      path: "/options-summary?currency=SPCX&kind=option&include_rfq_provider_quotes=true&rfq_provider_quotes_limit=5",
    },
    {
      name: "orderbook",
      call: (client, signal) => client.orderbook({ instrumentId: 123, depth: 20 }, signal),
      path: "/orderbook?instrument_id=123&depth=20",
    },
    {
      name: "portfolio",
      call: (client, signal) => client.portfolio({ wallet: WALLET }, signal),
      path: `/portfolio?wallet=${LOWER_WALLET}`,
    },
    {
      name: "profile",
      call: (client, signal) => client.profile({ wallet: WALLET }, signal),
      path: `/profile?wallet=${LOWER_WALLET}`,
    },
    {
      name: "profileTrades",
      call: (client, signal) =>
        client.profileTrades({
          wallet: WALLET,
          limit: 25,
          offset: 0,
          from_ts_ms: 1_700_000_000_000,
          to_ts_ms: 1_700_086_400_000,
          symbol: "SPCX-20261231-10-C",
        }, signal),
      path:
        `/profile/trades?wallet=${LOWER_WALLET}&limit=25&offset=0&from_ts_ms=1700000000000&to_ts_ms=1700086400000&symbol=SPCX-20261231-10-C`,
    },
    {
      name: "profileRealizedPnl",
      call: (client, signal) =>
        client.profileRealizedPnl({
          wallet: WALLET,
          from_ts_ms: 1_700_000_000_000,
          to_ts_ms: 1_700_086_400_000,
        }, signal),
      path: `/profile/realized-pnl?wallet=${LOWER_WALLET}&from_ts_ms=1700000000000&to_ts_ms=1700086400000`,
    },
    {
      name: "orders",
      call: (client, signal) => client.orders({ wallet: WALLET, limit: 25, offset: 0, status: "open" }, signal),
      path: `/orders?wallet=${LOWER_WALLET}&limit=25&offset=0&status=open`,
    },
    {
      name: "fills",
      call: (client, signal) => client.fills({ wallet: WALLET, limit: 25, offset: 0 }, signal),
      path: `/fills?wallet=${LOWER_WALLET}&limit=25&offset=0`,
    },
    {
      name: "orderStatus",
      call: (client, signal) => client.orderStatus({ wallet: WALLET, orderId: "client-order-1" }, signal),
      path: `/orders/status?wallet=${LOWER_WALLET}&order_id=client-order-1`,
    },
    {
      name: "trades",
      call: (client, signal) => client.trades({ limit: 25, offset: 0 }, signal),
      path: "/trades?limit=25&offset=0",
    },
    {
      name: "trades by symbol",
      call: (client, signal) => client.trades({ symbol: "SPCX-20261231-10-C", limit: 25 }, signal),
      path: "/trades?limit=25&symbol=SPCX-20261231-10-C",
    },
    {
      name: "trades by underlying",
      call: (client, signal) => client.trades({ underlying: "SPCX", limit: 25, offset: 0 }, signal),
      path: "/trades?limit=25&offset=0&underlying=SPCX",
    },
    {
      name: "trades by account",
      call: (client, signal) => client.trades({ account: WALLET, limit: 25, offset: 0 }, signal),
      path: `/trades?limit=25&offset=0&account=${LOWER_WALLET}`,
    },
    {
      name: "trades after cursor",
      call: (client, signal) => client.trades({ after_trade_id: 36211, limit: 25 }, signal),
      path: "/trades?limit=25&after_trade_id=36211",
    },
    {
      name: "trade",
      call: (client, signal) => client.trade({ tradeId: 36211 }, signal),
      path: "/trades/36211",
    },
    {
      name: "historicalPnl",
      call: (client, signal) =>
        client.historicalPnl({
          wallet: WALLET,
          interval: "1h",
          limit: 24,
          includeAttribution: true,
        }, signal),
      path: `/historical-pnl?wallet=${LOWER_WALLET}&interval=1h&limit=24&include_attribution=true`,
    },
    {
      name: "liquidationStatus",
      call: (client, signal) => client.liquidationStatus({ wallet: WALLET }, signal),
      path: `/liquidation/status?wallet=${LOWER_WALLET}`,
    },
    {
      name: "liquidationHistory",
      call: (client, signal) => client.liquidationHistory({ wallet: WALLET, limit: 20, offset: 0 }, signal),
      path: `/liquidation/history?wallet=${LOWER_WALLET}&limit=20&offset=0`,
    },
    {
      name: "liquidations",
      call: (client, signal) =>
        client.liquidations({
          limit: 10,
          wallet: WALLET,
          status: "in_liquidation",
          state: "pre_liquidation",
          marginMode: "standard",
          liquidationMode: "full",
        }, signal),
      path:
        `/liquidations?limit=10&wallet=${LOWER_WALLET}&status=in_liquidation&state=pre_liquidation&margin_mode=standard&liquidation_mode=full`,
    },
    {
      name: "settlementPayouts",
      call: (client, signal) =>
        client.settlementPayouts({
          wallet: WALLET,
          limit: 25,
          offset: 0,
          symbol: "SPCX-20261231-10-C",
          ledgerApplied: false,
        }, signal),
      path:
        `/settlement-payouts?wallet=${LOWER_WALLET}&limit=25&offset=0&symbol=SPCX-20261231-10-C&ledger_applied=false`,
    },
    {
      name: "authorizedAgents",
      call: (client, signal) => client.authorizedAgents({ wallet: WALLET }, signal),
      path: `/authorized-agents?wallet=${LOWER_WALLET}`,
    },
    {
      name: "riskGrid",
      call: (client, signal) => client.riskGrid({ wallet: WALLET }, signal),
      path: `/risk/grid?wallet=${LOWER_WALLET}`,
    },
    {
      name: "referralBinding",
      call: (client, signal) => client.referralBinding({ wallet: WALLET }, signal),
      path: `/referrals/binding?wallet=${LOWER_WALLET}`,
    },
    {
      name: "referralCodeByOwner",
      call: (client, signal) => client.referralCodeByOwner({ wallet: WALLET }, signal),
      path: `/referrals/code?wallet=${LOWER_WALLET}`,
    },
    {
      name: "referralCode",
      call: (client, signal) => client.referralCode({ code: "ALPHA/BETA" }, signal),
      path: "/referrals/code/ALPHA%2FBETA",
    },
    {
      name: "referredWallets",
      call: (client, signal) => client.referredWallets({ wallet: WALLET, limit: 25, offset: 50 }, signal),
      path: `/referrals/referred?wallet=${LOWER_WALLET}&limit=25&offset=50`,
    },
    {
      name: "transfers",
      call: (client, signal) =>
        client.transfers({
          wallet: WALLET,
          transactionTypes: ["deposit", "withdrawal"],
          assets: ["USDC", "HYPE"],
          statuses: ["completed", "pending"],
          limit: 25,
          cursor: "next/page",
        }, signal),
      path:
        `/v1/transfers?wallet=${LOWER_WALLET}&transaction_type=deposit%2Cwithdrawal&asset=USDC%2CHYPE&status=completed%2Cpending&limit=25&cursor=next%2Fpage`,
    },
    {
      name: "directiveStatus",
      call: (client, signal) => client.directiveStatus({ directiveId: "directive 1?" }, signal),
      path: "/v1/directives/directive%201%3F",
      init: { cache: "no-store" },
    },
    {
      name: "withdrawalHistory",
      call: (client, signal) => client.withdrawalHistory({ wallet: WALLET, limit: 5 }, signal),
      path: `/v1/withdrawals?wallet=${LOWER_WALLET}&limit=5`,
      init: { cache: "no-store" },
    },
    {
      name: "rfqStatus",
      call: (client, signal) => client.rfqStatus({ rfqId: "rfq/id?" }, signal),
      path: "/rfq/rfq%2Fid%3F",
    },
    {
      name: "historicalTheos",
      call: (client, signal) =>
        client.historicalTheos({
          instrumentName: "SPCX-20261231-10-C",
          interval: "1h",
          limit: 48,
        }, signal),
      path: "/historical-theos?instrument_name=SPCX-20261231-10-C&interval=1h&limit=48",
    },
    {
      name: "historicalTheosBatch",
      call: (client, signal) =>
        client.historicalTheosBatch({
          instrumentNames: ["SPCX-20261231-10-C", "SPCX-20261231-12-C"],
          interval: "1h",
          limit: 48,
        }, signal),
      path: "/historical-theos/batch?instrument_names=SPCX-20261231-10-C%2CSPCX-20261231-12-C&interval=1h&limit=48",
    },
  ];

  for (const testCase of cases) {
    test(`${testCase.name} sends the expected request`, async () => {
      const response = { method: testCase.name };
      const { client, transport } = createClient(response);
      const controller = new AbortController();

      const result = await testCase.call(client, controller.signal);

      assert.equal(result, response);
      assert.deepEqual(transport.calls, [
        {
          path: testCase.path,
          init: testCase.init ?? {},
          signal: controller.signal,
        },
      ]);
    });
  }

  test("validates parameters before sending a request", () => {
    const { client, transport } = createClient();

    assert.throws(
      () => client.portfolio({ wallet: "not-a-wallet" } as never),
      ValidationError,
    );
    assert.throws(
      () => client.profile({ wallet: "not-a-wallet" } as never),
      ValidationError,
    );
    assert.throws(
      () => client.profileTrades({ wallet: WALLET, offset: -1 }),
      ValidationError,
    );
    assert.throws(
      () => client.profileRealizedPnl({ wallet: WALLET, from_ts_ms: -1 }),
      ValidationError,
    );
    assert.throws(
      () => client.orderStatus({ wallet: WALLET, orderId: "" }),
      ValidationError,
    );
    assert.throws(
      () => client.trade({ tradeId: 0 }),
      ValidationError,
    );
    assert.throws(
      () => client.transfers({ wallet: WALLET, transactionTypes: ["unknown"] } as never),
      ValidationError,
    );

    assert.deepEqual(transport.calls, []);
  });

  test("validates mutually exclusive trades filters before sending a request", () => {
    const { client, transport } = createClient();

    assert.throws(
      () => client.trades({ symbol: "SPCX-20261231-10-C", underlying: "SPCX" } as never),
      ValidationError,
    );
    assert.throws(
      () => client.trades({ symbol: "SPCX-20261231-10-C", offset: 0 } as never),
      ValidationError,
    );
    assert.throws(
      () => client.trades({ account: "not-a-wallet" } as never),
      ValidationError,
    );
    assert.throws(
      () => client.trades({ after_trade_id: 36211, offset: 0 } as never),
      ValidationError,
    );
    assert.throws(
      () => client.trades({ after_trade_id: 36211, underlying: "SPCX" } as never),
      ValidationError,
    );

    assert.deepEqual(transport.calls, []);
  });
});
