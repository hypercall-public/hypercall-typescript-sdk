import { HttpTransport, InfoClient, type LiquidationHistoryEntry, type LiquidationStatusData } from "@hypercallxyz/sdk";

const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const statusResponse = await info.liquidationStatus({ wallet });
const status: LiquidationStatusData | null | undefined = statusResponse.data;

const historyResponse = await info.liquidationHistory({
  wallet,
  limit: 20,
  offset: 0,
});
const latestHistory: LiquidationHistoryEntry | undefined = historyResponse.data[0];

const publicLiquidations = await info.liquidations({
  limit: 20,
  status: "in_liquidation",
});

console.log({
  state: status?.state,
  shortfall: status?.shortfall,
  latestTransition: latestHistory?.new_state,
  publicLiquidationCount: publicLiquidations.data.length,
});
