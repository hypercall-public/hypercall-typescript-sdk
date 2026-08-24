import { HttpTransport, InfoClient, type Trade } from "@hypercallxyz/sdk";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const recentTrades = await info.trades({ limit: 10, offset: 0 });
const latestTrade: Trade | undefined = recentTrades.data[0];
const latestTradeResponse = latestTrade ? await info.trade({ tradeId: latestTrade.trade_id }) : undefined;
const nextTrades = latestTrade ? await info.trades({ after_trade_id: latestTrade.trade_id, limit: 10 }) : undefined;

const symbolTrades = latestTrade ? await info.trades({ symbol: latestTrade.symbol, limit: 10 }) : undefined;

const underlyingTrades = await info.trades({
  underlying: "BTC",
  limit: 10,
  offset: 0,
});

const account = latestTrade?.taker_address ?? latestTrade?.maker_address;
const accountTrades = account ? await info.trades({ account, limit: 10, offset: 0 }) : undefined;

console.log({
  latestTradeId: latestTrade?.trade_id,
  latestSymbol: latestTrade?.symbol,
  latestPrice: latestTrade?.price,
  latestTakerSide: latestTradeResponse?.data.taker_side,
  nextTradeCount: nextTrades?.data.length,
  symbolTradeCount: symbolTrades?.data.length,
  underlyingTradeCount: underlyingTrades.data.length,
  accountTradeCount: accountTrades?.data.length,
});
