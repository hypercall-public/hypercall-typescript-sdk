/**
 * TEE perp trading: preview, place a bracket order, cancel it, change leverage.
 *
 * The SDK builds the exact EIP-712 typed data the server verifies; the caller
 * signs it with the account's API wallet. `signTypedData` below stands in for
 * any EIP-712 signer (viem `privateKeyToAccount(key).signTypedData`, ethers
 * `signer.signTypedData`, a wallet provider, a KMS).
 *
 * Run: deno task example examples/tee-perp-trading.ts
 */
import { ExchangeClient, HttpTransport, InfoClient } from "@hypercallxyz/sdk";
import {
  buildHlCancelByCloidAction,
  buildTeePerpBracketBatchAction,
  buildTeePerpCancelByCloidTypedData,
  buildTeePerpLeverageAction,
  buildTeePerpLeverageTypedData,
  buildTeePerpOrderBatchTypedData,
  createServerClock,
  formatPerpMarketLimitPrice,
  resolvePerpTriggerLimitPrice,
  TeePerpNonceManager,
} from "@hypercallxyz/sdk/signing";

const API_URL = "https://api.hypercall.xyz";
const CHAIN_ID = 999;
const ACCOUNT = "0x0000000000000000000000000000000000000000"; // Account.sol address
const ASSET = 0; // Hyperliquid asset index; see info.teePerpMarkets()
const SIZE_DECIMALS = 5; // Hyperliquid szDecimals for the market

// Replace with a real API-wallet signer.
const signTypedData = (_typedData: unknown): Promise<string> => Promise.resolve(`0x${"00".repeat(65)}`);

const transport = new HttpTransport({ apiUrl: API_URL });
const info = new InfoClient({ transport });
const exchange = new ExchangeClient({ transport });

// The server derives the venue expiry from the nonce, so stamp it on the server clock.
const nonces = new TeePerpNonceManager(createServerClock({ apiUrl: API_URL }));

const { markets } = await info.teePerpMarkets();
console.log(markets.filter((market) => market.supported).map((market) => market.hyperliquidCoin));

// A market buy is an IOC limit at a slippage-bounded price; exits are market triggers.
const entryPrice = formatPerpMarketLimitPrice({ referencePrice: "100000", side: "Buy", sizeDecimals: SIZE_DECIMALS });
const stopLoss = {
  triggerPrice: "95000",
  limitPrice: resolvePerpTriggerLimitPrice({
    kind: "stopMarket",
    side: "Sell",
    triggerPrice: "95000",
    sizeDecimals: SIZE_DECIMALS,
  }),
};

const preview = await info.teePerpPreview({
  account: ACCOUNT,
  action: {
    kind: "order_batch",
    grouping: "normalTpsl",
    orders: [
      { asset: ASSET, isBuy: true, limitPx: entryPrice, sz: "0.01", orderType: { limit: { tif: "Ioc" } } },
      {
        asset: ASSET,
        isBuy: false,
        limitPx: stopLoss.limitPrice,
        sz: "0.01",
        reduceOnly: true,
        orderType: { trigger: { triggerPx: stopLoss.triggerPrice, isMarket: true, tpsl: "sl" } },
      },
    ],
  },
});
console.log(preview.data?.decision, preview.data?.reasonCode, preview.data?.liquidationPxAfter);

const nonce = await nonces.next();
const batch = buildTeePerpBracketBatchAction({
  entry: { asset: ASSET, isBuy: true, price: entryPrice, size: "0.01", tif: "ioc" },
  takeProfit: null,
  stopLoss,
  nonce,
});
const placed = await exchange.teePerpSubmitOrderBatch({
  account: ACCOUNT,
  nonce,
  action: batch,
  signature: await signTypedData(
    buildTeePerpOrderBatchTypedData({ account: ACCOUNT, nonce, batch, chainId: CHAIN_ID }),
  ),
});
if (placed.errorCode === "builder_not_approved") {
  console.log("Call Account.approveZeroFeeBuilder(builder) from the manager wallet first.");
}
console.log(placed.stage, placed.children);

const cancelNonce = await nonces.next();
const cancel = buildHlCancelByCloidAction({ asset: ASSET, cloid: batch.orders[1].cloid });
await exchange.teePerpCancelByCloid({
  account: ACCOUNT,
  nonce: cancelNonce,
  action: cancel,
  signature: await signTypedData(
    buildTeePerpCancelByCloidTypedData({ account: ACCOUNT, nonce: cancelNonce, action: cancel, chainId: CHAIN_ID }),
  ),
});

const leverageNonce = await nonces.next();
const leverage = buildTeePerpLeverageAction({ asset: ASSET, mode: "cross", leverage: 5 });
const updated = await exchange.teePerpUpdateLeverage({
  account: ACCOUNT,
  nonce: leverageNonce,
  action: leverage,
  signature: await signTypedData(
    buildTeePerpLeverageTypedData({ account: ACCOUNT, nonce: leverageNonce, action: leverage, chainId: CHAIN_ID }),
  ),
});
console.log(updated.stage, updated.reasonCode);
