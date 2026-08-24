import { HttpTransport, InfoClient, type ProfileTrade, type RealizedPnlRow } from "@hypercallxyz/sdk";

const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const profileResponse = await info.profile({ wallet });
const profile = profileResponse.data;

const tradesResponse = await info.profileTrades({
  wallet,
  limit: 25,
  offset: 0,
});
const latestTrade: ProfileTrade | undefined = tradesResponse.data[0];

const realizedPnlResponse = await info.profileRealizedPnl({ wallet });
const firstRealizedPnl: RealizedPnlRow | undefined = realizedPnlResponse.data[0];

console.log({
  wallet: profile.wallet,
  username: profile.username,
  equity: profile.margin.total,
  unrealizedPnl: profile.pnl.unrealized,
  latestTradeId: latestTrade?.trade_id,
  latestTradeRealizedPnl: latestTrade?.realized_pnl,
  firstRealizedPnlSymbol: firstRealizedPnl?.symbol,
  firstRealizedPnl: firstRealizedPnl?.realized_pnl,
});
