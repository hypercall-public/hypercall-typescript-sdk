import * as v from "@valibot/valibot";

import { parse, WalletAddress } from "../../_base.ts";
import type { Address, ApiResponse, Decimal } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

/** Request the portfolio-margin risk grid for a wallet. */
export const RiskGridRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
});
export type RiskGridRequest = v.InferOutput<typeof RiskGridRequest>;
export type RiskGridParameters = v.InferInput<typeof RiskGridRequest>;

/** Definition of one SPAN scenario. */
export type RiskScenarioDefinition = {
  id: string;
  spot_shock_pct: Decimal;
  vol_shock_pct: Decimal;
  pnl_weight: Decimal;
  is_tail: boolean;
};

/** Computed PnL for one SPAN scenario. */
export type RiskGridScenario = RiskScenarioDefinition & {
  total_pnl: Decimal;
};

/** Per-instrument row in an extended risk matrix. */
export type InstrumentRiskRow = {
  symbol: string;
  underlying: string;
  amount: Decimal;
  base_amount: Decimal;
  current_value: Decimal;
  scenario_pnls: Decimal[];
};

/** Extended SPAN matrix for an underlying. */
export type ExtendedRiskMatrix = {
  scenarios: RiskScenarioDefinition[];
  instruments: InstrumentRiskRow[];
  total_pnls: Decimal[];
  worst_scenario_index: number;
  worst_scenario_pnl: Decimal;
};

/** Risk grid for one independently configured underlying. */
export type UnderlyingRiskGrid = {
  underlying: string;
  scenarios: RiskGridScenario[];
  extended_risk_matrix: ExtendedRiskMatrix;
};

/** Top-level portfolio-margin risk grid. */
export type RiskGrid = {
  equity: Decimal;
  position_initial_margin: Decimal;
  position_maintenance_margin: Decimal;
  open_orders_initial_margin: Decimal;
  total_initial_margin: Decimal;
  scanning_risk: Decimal;
  option_floor: Decimal;
  gamma_overlay: Decimal;
  underlyings: UnderlyingRiskGrid[];
};

export type RiskGridResponse = ApiResponse<RiskGrid>;

/** Request the portfolio-margin risk grid for a wallet. */
export function riskGrid(
  config: InfoConfig,
  params: RiskGridParameters,
  signal?: AbortSignal,
): Promise<RiskGridResponse> {
  const request = parse(RiskGridRequest, params);
  const query = toQuery({ wallet: request.wallet.toLowerCase() as Address });
  return config.transport.request<RiskGridResponse>(`/risk/grid?${query}`, {}, signal);
}
