import {
  type AuthorizedAgentsResponse,
  type Fill,
  HttpTransport,
  InfoClient,
  type Order,
  type Portfolio,
  type SettlementPayout,
} from "@hypercallxyz/sdk";

const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const portfolioResponse = await info.portfolio({ wallet });
const portfolio: Portfolio | undefined = portfolioResponse.data;

const ordersResponse = await info.orders({ wallet, limit: 25, offset: 0 });
const orders: Order[] = ordersResponse.data;

const fillsResponse = await info.fills({ wallet, limit: 25, offset: 0 });
const fills: Fill[] = fillsResponse.data;

const payoutsResponse = await info.settlementPayouts({ wallet, limit: 25, offset: 0 });
const payouts: SettlementPayout[] = payoutsResponse.data;

const agents: AuthorizedAgentsResponse = await info.authorizedAgents({ wallet });

const pnl = await info.historicalPnl({
  wallet,
  interval: "1h",
  limit: 24,
});

console.log({
  wallet: portfolio?.wallet_address,
  availableBalance: portfolio?.available_balance,
  orderCount: orders.length,
  fillCount: fills.length,
  payoutCount: payouts.length,
  authorizedAgentCount: agents.agents.length,
  pnlPoints: pnl.data?.points.length,
});
