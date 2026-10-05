/**
 * Client for the Hypercall Info API endpoint.
 * @module
 */

import type { InfoConfig } from "./_methods/_base/mod.ts";

import {
  authorizedAgents,
  type AuthorizedAgentsParameters,
  type AuthorizedAgentsResponse,
} from "./_methods/authorizedAgents.ts";
import {
  directiveStatus,
  type DirectiveStatusParameters,
  type DirectiveStatusResponse,
  withdrawalHistory,
  type WithdrawalHistoryParameters,
  type WithdrawalHistoryResponse,
} from "./_methods/directives.ts";
import { exchangeInfo, type ExchangeInfoResponse } from "./_methods/exchangeInfo.ts";
import { fills, type FillsParameters, type FillsResponse } from "./_methods/fills.ts";
import { historicalPnl, type HistoricalPnlParameters, type HistoricalPnlResponse } from "./_methods/historicalPnl.ts";
import {
  historicalTheos,
  historicalTheosBatch,
  type HistoricalTheosBatchParameters,
  type HistoricalTheosBatchResponse,
  type HistoricalTheosParameters,
  type HistoricalTheosResponse,
} from "./_methods/historicalTheos.ts";
import { instruments, type InstrumentsParameters, type InstrumentsResponse } from "./_methods/instruments.ts";
import {
  liquidationHistory,
  type LiquidationHistoryParameters,
  type LiquidationHistoryResponse,
  liquidations,
  type LiquidationsParameters,
  type LiquidationsResponse,
  liquidationStatus,
  type LiquidationStatusParameters,
  type LiquidationStatusResponse,
} from "./_methods/liquidations.ts";
import {
  markets,
  type MarketsParameters,
  type MarketsResponse,
  type MarketsSlimParameters,
  type MarketsSlimResponse,
} from "./_methods/markets.ts";
import {
  optionSummaries,
  type OptionSummariesParameters,
  type OptionSummariesResponse,
} from "./_methods/optionSummaries.ts";
import { orderbook, type OrderbookParameters, type OrderbookResponse } from "./_methods/orderbook.ts";
import {
  orders,
  type OrdersParameters,
  type OrdersResponse,
  orderStatus,
  type OrderStatusParameters,
  type OrderStatusResponse,
} from "./_methods/orders.ts";
import { portfolio, type PortfolioParameters, type PortfolioResponse } from "./_methods/portfolio.ts";
import {
  profile,
  type ProfileParameters,
  profileRealizedPnl,
  type ProfileRealizedPnlParameters,
  type ProfileResponse,
  profileTrades,
  type ProfileTradesParameters,
  type ProfileTradesResponse,
  type RealizedPnlResponse,
} from "./_methods/profile.ts";
import {
  type ReferralBinding,
  referralBinding,
  type ReferralBindingParameters,
  type ReferralCode,
  referralCode,
  referralCodeByOwner,
  type ReferralCodeByOwnerParameters,
  type ReferralCodeParameters,
  referredWallets,
  type ReferredWalletsParameters,
  type ReferredWalletsResponse,
} from "./_methods/referrals.ts";
import { rfqStatus, type RfqStatusParameters, type RfqStatusResponse } from "./_methods/rfq.ts";
import { riskGrid, type RiskGridParameters, type RiskGridResponse } from "./_methods/riskGrid.ts";
import {
  settlementPayouts,
  type SettlementPayoutsParameters,
  type SettlementPayoutsResponse,
} from "./_methods/settlementPayouts.ts";
import {
  trade,
  type TradeParameters,
  type TradeResponse,
  trades,
  type TradesParameters,
  type TradesResponse,
} from "./_methods/trades.ts";
import { transfers, type TransfersParameters, type TransfersResponse } from "./_methods/transfers.ts";
import { teePerpMarkets, type TeePerpMarketsResponse } from "./_methods/teePerpMarkets.ts";
import {
  teePerpPreview,
  type TeePerpPreviewParameters,
  type TeePerpPreviewResponse,
} from "./_methods/teePerpPreview.ts";

/** A client for interacting with the Hypercall Info API. */
export class InfoClient<C extends InfoConfig = InfoConfig> {
  config_: C;

  constructor(config: C) {
    this.config_ = config;
  }

  /**
   * Request listed markets.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Listed markets response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.markets({ include_instruments: false });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  markets(params: MarketsSlimParameters, signal?: AbortSignal): Promise<MarketsSlimResponse>;
  markets(
    params?: MarketsParameters,
    signal?: AbortSignal,
  ): Promise<MarketsResponse>;
  markets(signal?: AbortSignal): Promise<MarketsResponse>;
  markets(
    paramsOrSignal?: MarketsParameters | AbortSignal,
    maybeSignal?: AbortSignal,
  ): Promise<MarketsResponse | MarketsSlimResponse> {
    const params = paramsOrSignal instanceof AbortSignal ? {} : (paramsOrSignal ?? {});
    const signal = paramsOrSignal instanceof AbortSignal ? paramsOrSignal : maybeSignal;
    return markets(this.config_, params, signal);
  }

  /**
   * Request exchange metadata.
   *
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Exchange metadata response.
   *
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.exchangeInfo();
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  exchangeInfo(signal?: AbortSignal): Promise<ExchangeInfoResponse> {
    return exchangeInfo(this.config_, signal);
  }

  /**
   * Request instruments for a currency.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Instruments response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.instruments({ currency: "SPCX" });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  instruments(
    params: InstrumentsParameters,
    signal?: AbortSignal,
  ): Promise<InstrumentsResponse> {
    return instruments(this.config_, params, signal);
  }

  /**
   * Request option summaries for a currency.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Option summaries response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.optionSummaries({ currency: "SPCX" });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  optionSummaries(
    params: OptionSummariesParameters,
    signal?: AbortSignal,
  ): Promise<OptionSummariesResponse> {
    return optionSummaries(this.config_, params, signal);
  }

  /**
   * Request orderbook for an instrument.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Orderbook response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.orderbook({ instrumentId: 1, depth: 15 });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  orderbook(
    params: OrderbookParameters,
    signal?: AbortSignal,
  ): Promise<OrderbookResponse> {
    return orderbook(this.config_, params, signal);
  }

  /**
   * Request portfolio for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Portfolio response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.portfolio({
   *   wallet: "0x0000000000000000000000000000000000000000",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  portfolio(
    params: PortfolioParameters,
    signal?: AbortSignal,
  ): Promise<PortfolioResponse> {
    return portfolio(this.config_, params, signal);
  }

  /**
   * Request profile stats for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Profile response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.profile({
   *   wallet: "0x0000000000000000000000000000000000000000",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  profile(
    params: ProfileParameters,
    signal?: AbortSignal,
  ): Promise<ProfileResponse> {
    return profile(this.config_, params, signal);
  }

  /**
   * Request profile trade history for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Profile trade history response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.profileTrades({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   limit: 25,
   *   offset: 0,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  profileTrades(
    params: ProfileTradesParameters,
    signal?: AbortSignal,
  ): Promise<ProfileTradesResponse> {
    return profileTrades(this.config_, params, signal);
  }

  /**
   * Request realized PnL by symbol for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Realized PnL by symbol response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.profileRealizedPnl({
   *   wallet: "0x0000000000000000000000000000000000000000",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  profileRealizedPnl(
    params: ProfileRealizedPnlParameters,
    signal?: AbortSignal,
  ): Promise<RealizedPnlResponse> {
    return profileRealizedPnl(this.config_, params, signal);
  }

  /**
   * Request orders for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Orders response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.orders({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   limit: 50,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  orders(
    params: OrdersParameters,
    signal?: AbortSignal,
  ): Promise<OrdersResponse> {
    return orders(this.config_, params, signal);
  }

  /**
   * Request fills for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Fills response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.fills({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   limit: 50,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  fills(
    params: FillsParameters,
    signal?: AbortSignal,
  ): Promise<FillsResponse> {
    return fills(this.config_, params, signal);
  }

  /**
   * Request public venue trades.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Public venue trades response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.trades({
   *   underlying: "BTC",
   *   limit: 50,
   *   offset: 0,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  trades(
    params: TradesParameters = {},
    signal?: AbortSignal,
  ): Promise<TradesResponse> {
    return trades(this.config_, params, signal);
  }

  /**
   * Request historical account equity and PnL snapshots.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Historical account equity and PnL response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.historicalPnl({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   interval: "1h",
   *   limit: 24,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  historicalPnl(
    params: HistoricalPnlParameters,
    signal?: AbortSignal,
  ): Promise<HistoricalPnlResponse> {
    return historicalPnl(this.config_, params, signal);
  }

  /**
   * Request liquidation status for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Liquidation status response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.liquidationStatus({
   *   wallet: "0x0000000000000000000000000000000000000000",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  liquidationStatus(
    params: LiquidationStatusParameters,
    signal?: AbortSignal,
  ): Promise<LiquidationStatusResponse> {
    return liquidationStatus(this.config_, params, signal);
  }

  /**
   * Request liquidation history for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Liquidation history response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.liquidationHistory({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   limit: 20,
   *   offset: 0,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  liquidationHistory(
    params: LiquidationHistoryParameters,
    signal?: AbortSignal,
  ): Promise<LiquidationHistoryResponse> {
    return liquidationHistory(this.config_, params, signal);
  }

  /**
   * Request public liquidation transitions.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Public liquidation transitions response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.liquidations({
   *   limit: 50,
   *   status: "in_liquidation",
   *   marginMode: "standard",
   *   liquidationMode: "full",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  liquidations(
    params: LiquidationsParameters = {},
    signal?: AbortSignal,
  ): Promise<LiquidationsResponse> {
    return liquidations(this.config_, params, signal);
  }

  /**
   * Request settlement payouts for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Settlement payouts response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.settlementPayouts({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   limit: 25,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  settlementPayouts(
    params: SettlementPayoutsParameters,
    signal?: AbortSignal,
  ): Promise<SettlementPayoutsResponse> {
    return settlementPayouts(this.config_, params, signal);
  }

  /**
   * Request authorized agents for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Authorized agents response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.authorizedAgents({
   *   wallet: "0x0000000000000000000000000000000000000000",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  authorizedAgents(
    params: AuthorizedAgentsParameters,
    signal?: AbortSignal,
  ): Promise<AuthorizedAgentsResponse> {
    return authorizedAgents(this.config_, params, signal);
  }

  /**
   * Request status for a directive by ID.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Directive status response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.directiveStatus({
   *   directiveId: "directive-id-from-withdrawal-response",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  directiveStatus(
    params: DirectiveStatusParameters,
    signal?: AbortSignal,
  ): Promise<DirectiveStatusResponse> {
    return directiveStatus(this.config_, params, signal);
  }

  /**
   * Request withdrawal history for a wallet.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Withdrawal history response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.withdrawalHistory({
   *   wallet: "0x0000000000000000000000000000000000000000",
   *   limit: 5,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  withdrawalHistory(
    params: WithdrawalHistoryParameters,
    signal?: AbortSignal,
  ): Promise<WithdrawalHistoryResponse> {
    return withdrawalHistory(this.config_, params, signal);
  }

  /**
   * Request RFQ status and quotes by RFQ ID.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return RFQ status response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.rfqStatus({
   *   rfqId: "00000000-0000-0000-0000-000000000000",
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  rfqStatus(
    params: RfqStatusParameters,
    signal?: AbortSignal,
  ): Promise<RfqStatusResponse> {
    return rfqStatus(this.config_, params, signal);
  }

  /**
   * Request historical theoretical prices for an option instrument.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Historical theoretical-price response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.historicalTheos({
   *   instrumentName: "SPCX-20261231-10-C",
   *   interval: "1h",
   *   limit: 48,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  historicalTheos(
    params: HistoricalTheosParameters,
    signal?: AbortSignal,
  ): Promise<HistoricalTheosResponse> {
    return historicalTheos(this.config_, params, signal);
  }

  /**
   * Request historical theoretical prices for multiple option instruments.
   *
   * @param params Parameters specific to the API request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Batch historical theoretical-price response.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   *
   * @example
   * ```ts
   * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
   *
   * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
   * const client = new InfoClient({ transport });
   *
   * const data = await client.historicalTheosBatch({
   *   instrumentNames: ["SPCX-20261231-10-C", "SPCX-20261231-12-C"],
   *   interval: "1h",
   *   limit: 48,
   * });
   * ```
   *
   * @see https://docs.hypercall.xyz/docs/trading/over-api/
   */
  historicalTheosBatch(
    params: HistoricalTheosBatchParameters,
    signal?: AbortSignal,
  ): Promise<HistoricalTheosBatchResponse> {
    return historicalTheosBatch(this.config_, params, signal);
  }

  /** Request one trade by its unique trade ID. */
  trade(params: TradeParameters, signal?: AbortSignal): Promise<TradeResponse> {
    return trade(this.config_, params, signal);
  }

  /** Request a HyperCore order status by numeric order ID or client order ID. */
  orderStatus(params: OrderStatusParameters, signal?: AbortSignal): Promise<OrderStatusResponse> {
    return orderStatus(this.config_, params, signal);
  }

  /** Request the portfolio-margin risk grid for a wallet. */
  riskGrid(params: RiskGridParameters, signal?: AbortSignal): Promise<RiskGridResponse> {
    return riskGrid(this.config_, params, signal);
  }

  /** Return the projected referral binding for a wallet. */
  referralBinding(params: ReferralBindingParameters, signal?: AbortSignal): Promise<ReferralBinding> {
    return referralBinding(this.config_, params, signal);
  }

  /** Return the permanent referral code owned by a wallet. */
  referralCodeByOwner(params: ReferralCodeByOwnerParameters, signal?: AbortSignal): Promise<ReferralCode | null> {
    return referralCodeByOwner(this.config_, params, signal);
  }

  /** Resolve a referral code to its owner. */
  referralCode(params: ReferralCodeParameters, signal?: AbortSignal): Promise<ReferralCode> {
    return referralCode(this.config_, params, signal);
  }

  /** Return referred wallets and projected lifetime Hypercall fill volume. */
  referredWallets(params: ReferredWalletsParameters, signal?: AbortSignal): Promise<ReferredWalletsResponse> {
    return referredWallets(this.config_, params, signal);
  }

  /** Return unified deposit, withdrawal, and internal transfer history. */
  transfers(params: TransfersParameters, signal?: AbortSignal): Promise<TransfersResponse> {
    return transfers(this.config_, params, signal);
  }

  /**
   * List the perp markets configured for TEE trading and whether each is supported.
   *
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Configured TEE perp markets.
   *
   * @throws {TransportError} When the transport layer throws an error.
   */
  teePerpMarkets(signal?: AbortSignal): Promise<TeePerpMarketsResponse> {
    return teePerpMarkets(this.config_, signal);
  }

  /**
   * Preview a TEE perp order, order batch, or leverage change: admission decision, reason code,
   * margin before and after, liquidation prices, and max size. Read-only; no signature.
   *
   * @param params Preview request.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Preview response envelope.
   *
   * @throws {ValidationError} When the request parameters fail validation (before sending).
   * @throws {TransportError} When the transport layer throws an error.
   */
  teePerpPreview(params: TeePerpPreviewParameters, signal?: AbortSignal): Promise<TeePerpPreviewResponse> {
    return teePerpPreview(this.config_, params, signal);
  }
}

export type {
  AuthorizedAgentsParameters,
  AuthorizedAgentsRequest,
  AuthorizedAgentsResponse,
} from "./_methods/authorizedAgents.ts";
export type {
  DirectiveDeliveryStatus,
  DirectiveDomainStatus,
  DirectiveStatusParameters,
  DirectiveStatusRequest,
  DirectiveStatusResponse,
  WithdrawalHistoryParameters,
  WithdrawalHistoryRequest,
  WithdrawalHistoryResponse,
} from "./_methods/directives.ts";
export type {
  Address,
  ApiResponse,
  Decimal,
  Greeks,
  InstrumentType,
  JsonRpcError,
  JsonRpcResponse,
  ListResponse,
  PaginatedResponse,
  Pagination,
  Side,
  TickSizeStep,
} from "./_methods/_base/_schemas.ts";
export type { ExchangeInfoRequest, ExchangeInfoResponse, SigningDomainInfo } from "./_methods/exchangeInfo.ts";
export type { Fill, FillsParameters, FillsRequest, FillsResponse } from "./_methods/fills.ts";
export type {
  HistoricalPnlData,
  HistoricalPnlInterval,
  HistoricalPnlParameters,
  HistoricalPnlPoint,
  HistoricalPnlRequest,
  HistoricalPnlResponse,
  SymbolAttribution,
} from "./_methods/historicalPnl.ts";
export type {
  HistoricalTheoData,
  HistoricalTheoInterval,
  HistoricalTheoPoint,
  HistoricalTheosBatchParameters,
  HistoricalTheosBatchRequest,
  HistoricalTheosBatchResponse,
  HistoricalTheosParameters,
  HistoricalTheosRequest,
  HistoricalTheosResponse,
} from "./_methods/historicalTheos.ts";
export type {
  Instrument,
  InstrumentsParameters,
  InstrumentsRequest,
  InstrumentsResponse,
} from "./_methods/instruments.ts";
export type {
  CursorPage,
  FullLiquidationStatusData,
  LiquidationHistoryEntry,
  LiquidationHistoryParameters,
  LiquidationHistoryRequest,
  LiquidationHistoryResponse,
  LiquidationMode,
  LiquidationsParameters,
  LiquidationsRequest,
  LiquidationsResponse,
  LiquidationState,
  LiquidationStatusData,
  LiquidationStatusParameters,
  LiquidationStatusRequest,
  LiquidationStatusResponse,
  MarginMode,
  PartialLiquidationStatusData,
  StandardMarginLiquidationPosition,
} from "./_methods/liquidations.ts";
export type {
  InstrumentStatus,
  Market,
  MarketInstrument,
  MarketSlim,
  MarketsParameters,
  MarketsRequest,
  MarketsResponse,
  MarketsSlimParameters,
  MarketsSlimResponse,
} from "./_methods/markets.ts";
export type {
  OptionSummariesParameters,
  OptionSummariesRequest,
  OptionSummariesResponse,
  OptionSummary,
} from "./_methods/optionSummaries.ts";
export type {
  OrderBook,
  OrderbookParameters,
  OrderbookRequest,
  OrderbookResponse,
  OrderBookStats,
} from "./_methods/orderbook.ts";
export type {
  Order,
  OrdersParameters,
  OrdersRequest,
  OrdersResponse,
  OrderStatus,
  OrderStatusParameters,
  OrderStatusRequest,
  OrderStatusResponse,
  TimeInForce,
} from "./_methods/orders.ts";
export type {
  MarginSummary,
  Portfolio,
  PortfolioParameters,
  PortfolioPosition,
  PortfolioRequest,
  PortfolioResponse,
  SpanMarginSummary,
} from "./_methods/portfolio.ts";
export type {
  ProfileData,
  ProfileMarginStats,
  ProfileParameters,
  ProfilePnlStats,
  ProfileRealizedPnlParameters,
  ProfileRealizedPnlRequest,
  ProfileRequest,
  ProfileResponse,
  ProfileTrade,
  ProfileTradesParameters,
  ProfileTradesRequest,
  ProfileTradesResponse,
  RealizedPnlResponse,
  RealizedPnlRow,
} from "./_methods/profile.ts";
export type {
  ReferralBinding,
  ReferralBindingParameters,
  ReferralCode,
  ReferralCodeByOwnerParameters,
  ReferralCodeParameters,
  ReferredWallet,
  ReferredWalletsParameters,
  ReferredWalletsResponse,
} from "./_methods/referrals.ts";
export type {
  ExtendedRiskMatrix,
  InstrumentRiskRow,
  RiskGrid,
  RiskGridParameters,
  RiskGridRequest,
  RiskGridResponse,
  RiskGridScenario,
  RiskScenarioDefinition,
  UnderlyingRiskGrid,
} from "./_methods/riskGrid.ts";
export type {
  RfqLeg,
  RfqQuote,
  RfqQuoteLeg,
  RfqStatus,
  RfqStatusParameters,
  RfqStatusRequest,
  RfqStatusResponse,
} from "./_methods/rfq.ts";
export type {
  SettlementPayout,
  SettlementPayoutsParameters,
  SettlementPayoutsRequest,
  SettlementPayoutsResponse,
} from "./_methods/settlementPayouts.ts";
export type {
  AccountTradesParameters,
  AllTradesParameters,
  CursorTradesParameters,
  SymbolTradesParameters,
  Trade,
  TradeParameters,
  TradeRequest,
  TradeResponse,
  TradesParameters,
  TradesRequest,
  TradesResponse,
  UnderlyingTradesParameters,
} from "./_methods/trades.ts";
export type {
  TransferHistoryEntry,
  TransferPage,
  TransfersParameters,
  TransfersRequest,
  TransfersResponse,
  TransferStatus,
  TransferType,
} from "./_methods/transfers.ts";
export type { TeePerpMarketEntry, TeePerpMarketsResponse } from "./_methods/teePerpMarkets.ts";
export type {
  PerpLiquidationBinding,
  PerpPreview,
  PerpPreviewAction,
  PerpPreviewMargin,
  PerpPreviewOrder,
  PerpPreviewOrderType,
  PerpPreviewTif,
  TeePerpPreviewParameters,
  TeePerpPreviewRequest,
  TeePerpPreviewResponse,
  VenueCompartmentRisk,
  VenueLiquidationRisk,
} from "./_methods/teePerpPreview.ts";
export type {
  HyperliquidActiveAssetDataResponse,
  HyperliquidUserRoleResponse,
  PerpLeverage,
} from "./_methods/hyperliquid.ts";
