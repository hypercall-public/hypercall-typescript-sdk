/**
 * TEE perp signing, encoding, and order-construction helpers.
 *
 * TEE perp orders are signed by the account's API wallet (the "app key") in the
 * `HypercallApiSign` EIP-712 domain. The server recomputes every digest from the
 * submitted wire values, so the typed data below must match the server's
 * `alloy::sol!` structs field for field. A drift fails closed as an invalid
 * signature.
 *
 * Wire encoding:
 * - Prices and sizes are 1e8-scaled unsigned integer strings (`limitPx`, `sz`,
 *   `triggerPx`).
 * - `encodedTif` is Hypercall's TIF byte: 1 = ALO, 2 = GTC, 3 = IOC.
 * - `cloid` is a non-zero decimal u128 string.
 * - `nonce` is a millisecond timestamp on the server clock. The server derives
 *   the venue expiry as `nonce + 9000` and accepts it only inside its own
 *   10 second window, so the nonce must sit in `(serverNow - 9000, serverNow + 1000]`.
 *   Use {@linkcode TeePerpNonceManager} with a server clock.
 *
 * @module
 */

import type { TypedField } from "./mod.ts";

// -------------------- Domains --------------------

/** EIP-712 domain name for API-wallet (app key) TEE perp actions. */
export const HYPERCALL_API_SIGN_DOMAIN_NAME = "HypercallApiSign";
/** EIP-712 domain name for account-manager actions (for example TEE wallet enrollment). */
export const HYPERCALL_MANAGER_SIGN_DOMAIN_NAME = "HypercallManagerSign";
/** HyperEVM chain IDs accepted by directive and TEE perp signing domains. */
export const TEE_PERP_CHAIN_IDS = [998, 999] as const;
export type TeePerpChainId = typeof TEE_PERP_CHAIN_IDS[number];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DIRECTIVE_DOMAIN_FIELDS = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
] as const satisfies readonly TypedField[];

export type DirectiveDomain<TName extends string> = {
  readonly name: TName;
  readonly version: "1";
  readonly chainId: number;
  readonly verifyingContract: typeof ZERO_ADDRESS;
};

function assertDirectiveChainId(chainId: number): void {
  if (!(TEE_PERP_CHAIN_IDS as readonly number[]).includes(chainId)) {
    throw new TypeError(`Unsupported directive chain id: ${chainId}`);
  }
}

/** The `HypercallApiSign` domain for chain 998 (testnet) or 999 (mainnet). */
export function createHypercallApiSignDomain(chainId: number): DirectiveDomain<typeof HYPERCALL_API_SIGN_DOMAIN_NAME> {
  assertDirectiveChainId(chainId);
  return { name: HYPERCALL_API_SIGN_DOMAIN_NAME, version: "1", chainId, verifyingContract: ZERO_ADDRESS };
}

/** The `HypercallManagerSign` domain for chain 998 (testnet) or 999 (mainnet). */
export function createHypercallManagerSignDomain(
  chainId: number,
): DirectiveDomain<typeof HYPERCALL_MANAGER_SIGN_DOMAIN_NAME> {
  assertDirectiveChainId(chainId);
  return { name: HYPERCALL_MANAGER_SIGN_DOMAIN_NAME, version: "1", chainId, verifyingContract: ZERO_ADDRESS };
}

// -------------------- EIP-712 types --------------------

/** `HLOrder` (one limit order), signed for `POST /v1/tee-perp/orders/submit`. */
export const HL_ORDER_TYPES = {
  LimitOrder: [
    { name: "asset", type: "uint32" },
    { name: "isBuy", type: "bool" },
    { name: "limitPx", type: "uint64" },
    { name: "sz", type: "uint64" },
    { name: "reduceOnly", type: "bool" },
    { name: "encodedTif", type: "uint8" },
    { name: "cloid", type: "uint128" },
  ],
  HLOrder: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "action", type: "LimitOrder" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

/** `HLCancel` (cancel by exchange order id), signed for `POST /v1/tee-perp/cancels/submit-by-oid`. */
export const HL_CANCEL_BY_OID_TYPES = {
  CancelOrderByOid: [
    { name: "asset", type: "uint32" },
    { name: "oid", type: "uint64" },
  ],
  HLCancel: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "action", type: "CancelOrderByOid" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

/** `HLCancelByCloid`, signed for `POST /v1/tee-perp/cancels/submit`. */
export const HL_CANCEL_BY_CLOID_TYPES = {
  CancelOrderByCloid: [
    { name: "asset", type: "uint32" },
    { name: "cloid", type: "uint128" },
  ],
  HLCancelByCloid: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "action", type: "CancelOrderByCloid" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

const PERP_ORDER_TERMS = [
  { name: "asset", type: "uint32" },
  { name: "isBuy", type: "bool" },
  { name: "limitPx", type: "uint64" },
  { name: "sz", type: "uint64" },
  { name: "reduceOnly", type: "bool" },
  { name: "encodedTif", type: "uint8" },
  { name: "triggerPx", type: "uint64" },
  { name: "isMarket", type: "bool" },
  { name: "tpsl", type: "uint8" },
  { name: "cloid", type: "uint128" },
] as const satisfies readonly TypedField[];

/** `HCPerpTriggerOrder`, signed for `POST /v1/tee-perp/orders/submit-trigger`. */
export const HC_PERP_TRIGGER_ORDER_TYPES = {
  PerpOrderTerms: PERP_ORDER_TERMS,
  HCPerpTriggerOrder: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "order", type: "PerpOrderTerms" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

/** `HCPerpOrderBatch`, signed for `POST /v1/tee-perp/orders/submit-batch`. */
export const HC_PERP_ORDER_BATCH_TYPES = {
  PerpOrderTerms: PERP_ORDER_TERMS,
  HCPerpOrderBatch: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "grouping", type: "uint8" },
    { name: "orders", type: "PerpOrderTerms[]" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

/** `HCPerpLeverageChange`, signed for `POST /v1/tee-perp/leverage/submit`. */
export const HC_PERP_LEVERAGE_CHANGE_TYPES = {
  PerpLeverageChange: [
    { name: "asset", type: "uint32" },
    { name: "isCross", type: "bool" },
    { name: "leverage", type: "uint32" },
  ],
  HCPerpLeverageChange: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "action", type: "PerpLeverageChange" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

/**
 * `HLAddApiWallet`, signed by the account manager in the `HypercallManagerSign`
 * domain to enroll the TEE API wallet. The server returns this typed data from
 * `POST /v1/tee-api-wallet/approval-request`; sign it as returned.
 */
export const HL_ADD_API_WALLET_TYPES = {
  AddApiWallet: [
    { name: "apiWalletAddress", type: "address" },
    { name: "apiWalletName", type: "string" },
  ],
  HLAddApiWallet: [
    { name: "account", type: "address" },
    { name: "nonce", type: "uint64" },
    { name: "action", type: "AddApiWallet" },
  ],
} as const satisfies Record<string, readonly TypedField[]>;

// -------------------- Wire types --------------------

/** Perp time in force. Market orders are IOC limits. */
export type PerpTif = "gtc" | "ioc" | "alo";
/** Hypercall's encoded TIF byte. */
export type EncodedPerpTif = 1 | 2 | 3;
/** Trigger direction: take profit or stop loss. */
export type PerpTpsl = "tp" | "sl";
/** Native order grouping of a batch. */
export type TeePerpOrderGrouping = "na" | "normalTpsl" | "positionTpsl";

/** `HlLimitOrderAction` wire body for `/v1/tee-perp/orders/submit`. */
export type HlLimitOrderAction = {
  asset: number;
  isBuy: boolean;
  /** Limit price in 1e8 units. */
  limitPx: string;
  /** Size in 1e8 units. */
  sz: string;
  reduceOnly: boolean;
  encodedTif: EncodedPerpTif;
  /** Non-zero decimal u128 client order id. */
  cloid: string;
};

/** `HlCancelByCloidAction` wire body. */
export type HlCancelByCloidAction = { asset: number; cloid: string };
/** `HlCancelByOidAction` wire body. */
export type HlCancelByOidAction = { asset: number; oid: string };
/** Leverage or margin-mode change wire body. */
export type TeePerpLeverageAction = { asset: number; isCross: boolean; leverage: number };

/** Exactly one of `limit` or `trigger`. */
export type TeePerpOrderTypeWire =
  | { limit: { encodedTif: EncodedPerpTif } }
  | { trigger: { triggerPx: string; isMarket: boolean; tpsl: PerpTpsl } };

/** One native order, as the trigger and batch routes accept it. */
export type TeePerpOrderWire = {
  asset: number;
  isBuy: boolean;
  /** Limit price in 1e8 units. For a market trigger, the worst execution price. */
  limitPx: string;
  sz: string;
  reduceOnly: boolean;
  orderType: TeePerpOrderTypeWire;
  cloid: string;
};

/** A native order batch: 1 to 100 children with distinct cloids. */
export type TeePerpOrderBatchAction = {
  orders: TeePerpOrderWire[];
  grouping: TeePerpOrderGrouping;
};

// -------------------- Constants --------------------

const PERP_UNIT_DECIMALS = 8;
const U32_MAX = 4_294_967_295;
const U64_MAX = (1n << 64n) - 1n;
const U128_MAX = (1n << 128n) - 1n;
/** Hyperliquid accepts at most this many children in one order action. */
export const MAX_TEE_PERP_ORDER_BATCH_CHILDREN = 100;
/** Venue TTL the server adds to the signed nonce. */
export const TEE_PERP_VENUE_TTL_MS = 9_000;
/** Server window for the venue expiry, measured from its own clock. */
export const TEE_PERP_MAX_ACTION_TTL_MS = 10_000;
/** Default slippage band for market orders and market triggers (frontend parity). */
export const PERP_MARKET_SLIPPAGE_BPS = 2_000;
const BPS_DENOMINATOR = 10_000;
/** Hyperliquid perp price precision. */
export const HYPERLIQUID_PERP_MAX_PRICE_DECIMALS = 6;
export const HYPERLIQUID_PERP_MAX_PRICE_SIGNIFICANT_FIGURES = 5;
const MAX_SIZE_DECIMALS = 8;
const MAX_BATCH_CLOID_CHILDREN = 255;

/** The exact refusal the API returns while the enclave policy does not allow trigger and batch orders. */
export const TEE_PERP_BATCH_POLICY_DISABLED_MESSAGE =
  "native trigger and batch orders are not enabled by the current TEE policy";

// -------------------- Decimal helpers --------------------

type DecimalUnits = { units: bigint; scale: number };

function parseUnsignedDecimal(value: string, label: string): DecimalUnits {
  const trimmed = String(value).trim();
  const match = /^(\d*)(?:\.(\d*))?$/.exec(trimmed);
  if (!match || (!match[1] && !match[2])) {
    throw new TypeError(`${label} must be a positive decimal`);
  }
  const integer = match[1] || "0";
  const fraction = match[2] ?? "";
  return { units: BigInt(`${integer}${fraction}`), scale: fraction.length };
}

function formatUnsignedUnits(units: bigint, scale: number): string {
  if (units <= 0n) return "";
  if (scale === 0) return units.toString();
  const raw = units.toString().padStart(scale + 1, "0");
  const integer = raw.slice(0, -scale).replace(/^0+(?=\d)/, "");
  const fraction = raw.slice(-scale).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
}

function compareDecimals(a: string, b: string): number {
  const left = parseUnsignedDecimal(a, "value");
  const right = parseUnsignedDecimal(b, "value");
  const scale = Math.max(left.scale, right.scale);
  const l = left.units * 10n ** BigInt(scale - left.scale);
  const r = right.units * 10n ** BigInt(scale - right.scale);
  return l === r ? 0 : l < r ? -1 : 1;
}

function toUnitsAtScale(value: string, scale: number): bigint {
  const parsed = parseUnsignedDecimal(value, "value");
  return parsed.scale > scale
    ? parsed.units / 10n ** BigInt(parsed.scale - scale)
    : parsed.units * 10n ** BigInt(scale - parsed.scale);
}

function normalizeSizeDecimals(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_SIZE_DECIMALS
    ? value
    : null;
}

/** Scale a positive decimal (at most 8 decimals) to a 1e8 u64 integer string. */
export function scalePerpDecimalTo1e8(value: string, label = "Value"): string {
  const { units, scale } = parseUnsignedDecimal(value, label);
  if (scale > PERP_UNIT_DECIMALS) {
    throw new TypeError(`${label} supports at most ${PERP_UNIT_DECIMALS} decimals`);
  }
  const scaled = units * 10n ** BigInt(PERP_UNIT_DECIMALS - scale);
  if (scaled <= 0n) throw new TypeError(`${label} must be greater than 0`);
  if (scaled > U64_MAX) throw new TypeError(`${label} is too large`);
  return scaled.toString();
}

/** Encode a TIF as Hypercall's TIF byte (1 = ALO, 2 = GTC, 3 = IOC). */
export function encodePerpTif(tif: PerpTif): EncodedPerpTif {
  switch (tif) {
    case "alo":
      return 1;
    case "gtc":
      return 2;
    case "ioc":
      return 3;
  }
}

function validateAsset(asset: number): number {
  if (!Number.isInteger(asset) || asset < 0 || asset > U32_MAX) {
    throw new TypeError("asset must be a u32 Hyperliquid perp asset index");
  }
  return asset;
}

function normalizeUintString(value: string | number | bigint, label: string, max: bigint): string {
  const raw = String(value).trim();
  let parsed: bigint;
  if (/^0x[0-9a-fA-F]+$/.test(raw) || /^[0-9]+$/.test(raw)) {
    parsed = BigInt(raw);
  } else {
    throw new TypeError(`${label} must be a non-negative integer`);
  }
  if (parsed > max) throw new TypeError(`${label} is out of range`);
  return parsed.toString();
}

function normalizeCloid(cloid: string | number | bigint): string {
  const normalized = normalizeUintString(cloid, "cloid", U128_MAX);
  if (normalized === "0") throw new TypeError("cloid must be greater than zero");
  return normalized;
}

function checkNonce(nonce: number | bigint): bigint {
  const value = BigInt(nonce);
  if (value <= 0n || value > U64_MAX) {
    throw new TypeError("nonce must be a positive u64");
  }
  return value;
}

// -------------------- Nonce and server clock --------------------

/**
 * Server clock offset from a response `Date` header, as the frontend computes
 * it: the header has one-second resolution, so add half a second and compare
 * with the request midpoint. Returns null for a missing or invalid header.
 */
export function serverClockOffsetMs(
  dateHeader: string | null | undefined,
  sentMs: number,
  receivedMs: number,
): number | null {
  if (!dateHeader) return null;
  const serverMs = Date.parse(dateHeader);
  if (!Number.isFinite(serverMs) || receivedMs < sentMs) return null;
  return serverMs + 500 - Math.round((sentMs + receivedMs) / 2);
}

/** Options for {@linkcode createServerClock}. */
export type ServerClockOptions = {
  /** Hypercall API base URL, for example `https://api.hypercall.xyz`. */
  apiUrl: string | URL;
  /** Fetch implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** How long a measured offset is reused. Defaults to 60 seconds. */
  ttlMs?: number;
  /** Local clock. Defaults to `Date.now`. */
  now?: () => number;
};

/**
 * Create a function returning the API server's current time in milliseconds,
 * measured from the `Date` header of `GET /health` and cached for `ttlMs`.
 * If the server cannot be reached the local clock is returned uncached; the
 * server still enforces its own window on submission.
 */
export function createServerClock(options: ServerClockOptions): () => Promise<number> {
  const fetchImpl = options.fetch ?? fetch;
  const ttlMs = options.ttlMs ?? 60_000;
  const now = options.now ?? Date.now;
  let cached: { offsetMs: number; measuredAtMs: number } | null = null;
  const base = new URL(options.apiUrl);
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  const healthUrl = new URL("health", base);

  return async () => {
    const start = now();
    if (cached && start - cached.measuredAtMs < ttlMs) {
      return start + cached.offsetMs;
    }
    try {
      const sentMs = now();
      const response = await fetchImpl(healthUrl, { cache: "no-store" });
      const receivedMs = now();
      await response.body?.cancel();
      const offsetMs = serverClockOffsetMs(response.headers.get("date"), sentMs, receivedMs);
      if (offsetMs === null) return now();
      cached = { offsetMs, measuredAtMs: receivedMs };
      return now() + offsetMs;
    } catch {
      return now();
    }
  };
}

/**
 * Monotonic millisecond nonces for one signing key, stamped on the server
 * clock. Each call returns `max(previous, serverNow) + 1`.
 */
export class TeePerpNonceManager {
  #last = 0;
  #serverNowMs: () => number | Promise<number>;

  /** @param serverNowMs Server clock, for example from {@linkcode createServerClock}. */
  constructor(serverNowMs: () => number | Promise<number>) {
    this.#serverNowMs = serverNowMs;
  }

  /** Next nonce. Stays inside the server's `(now - 9000, now + 1000]` window under normal load. */
  async next(): Promise<number> {
    const now = Math.floor(await this.#serverNowMs());
    this.#last = Math.max(this.#last, now) + 1;
    return this.#last;
  }
}

/** Whether a nonce is acceptable to the server at `serverNowMs` (venue expiry = nonce + 9000). */
export function isTeePerpNonceFresh(nonce: number, serverNowMs: number): boolean {
  const expiresAfterMs = nonce + TEE_PERP_VENUE_TTL_MS;
  return nonce > 0 && expiresAfterMs > serverNowMs && expiresAfterMs <= serverNowMs + TEE_PERP_MAX_ACTION_TTL_MS;
}

/**
 * Child cloids for one signed batch: the nonce in the high bits and the
 * 1-based child index in the low byte. Distinct per child and never zero.
 */
export function deriveTeePerpBatchCloid(nonce: number | bigint, index: number): string {
  const value = checkNonce(nonce);
  if (!Number.isInteger(index) || index < 0 || index >= MAX_BATCH_CLOID_CHILDREN) {
    throw new TypeError("Invalid batch order index");
  }
  const cloid = (value << 8n) + BigInt(index + 1);
  if (cloid > U128_MAX) throw new TypeError("Batch cloid is out of range");
  return cloid.toString();
}

// -------------------- Wire builders --------------------

/** Build a plain limit order action. `cloid` defaults to the nonce, as the frontend does. */
export function buildHlLimitOrderAction(params: {
  asset: number;
  isBuy: boolean;
  /** Limit price as a decimal string. */
  price: string;
  /** Size in coins as a decimal string. */
  size: string;
  tif: PerpTif;
  reduceOnly?: boolean;
  cloid: string | number | bigint;
}): HlLimitOrderAction {
  return {
    asset: validateAsset(params.asset),
    isBuy: params.isBuy,
    limitPx: scalePerpDecimalTo1e8(params.price, "Limit price"),
    sz: scalePerpDecimalTo1e8(params.size, "Size"),
    reduceOnly: params.reduceOnly ?? false,
    encodedTif: encodePerpTif(params.tif),
    cloid: normalizeCloid(params.cloid),
  };
}

/** Build a cancel-by-cloid action. */
export function buildHlCancelByCloidAction(params: {
  asset: number;
  cloid: string | number | bigint;
}): HlCancelByCloidAction {
  return { asset: validateAsset(params.asset), cloid: normalizeCloid(params.cloid) };
}

/** Build a cancel-by-oid action. */
export function buildHlCancelByOidAction(
  params: { asset: number; oid: string | number | bigint },
): HlCancelByOidAction {
  const oid = normalizeUintString(params.oid, "oid", U64_MAX);
  if (oid === "0") throw new TypeError("oid must not be zero");
  return { asset: validateAsset(params.asset), oid };
}

/** Build a leverage / margin-mode change action. */
export function buildTeePerpLeverageAction(params: {
  asset: number;
  mode: "cross" | "isolated";
  leverage: number;
}): TeePerpLeverageAction {
  if (!Number.isInteger(params.leverage) || params.leverage < 1 || params.leverage > U32_MAX) {
    throw new TypeError("leverage must be a positive integer");
  }
  return { asset: validateAsset(params.asset), isCross: params.mode === "cross", leverage: params.leverage };
}

/** One limit child for a batch. */
export function buildTeePerpLimitOrderWire(params: {
  asset: number;
  isBuy: boolean;
  price: string;
  size: string;
  tif: PerpTif;
  reduceOnly?: boolean;
  cloid: string | number | bigint;
}): TeePerpOrderWire {
  return {
    asset: validateAsset(params.asset),
    isBuy: params.isBuy,
    limitPx: scalePerpDecimalTo1e8(params.price, "Limit price"),
    sz: scalePerpDecimalTo1e8(params.size, "Size"),
    reduceOnly: params.reduceOnly ?? false,
    orderType: { limit: { encodedTif: encodePerpTif(params.tif) } },
    cloid: normalizeCloid(params.cloid),
  };
}

/**
 * One native trigger (stop or take-profit) order. `limitPrice` is the signed
 * execution bound: the user's limit for a limit trigger, or the slippage-bounded
 * price from {@linkcode resolvePerpTriggerLimitPrice} for a market trigger.
 */
export function buildTeePerpTriggerOrderWire(params: {
  asset: number;
  isBuy: boolean;
  triggerPrice: string;
  limitPrice: string;
  size: string;
  isMarket: boolean;
  tpsl: PerpTpsl;
  reduceOnly?: boolean;
  cloid: string | number | bigint;
}): TeePerpOrderWire {
  return {
    asset: validateAsset(params.asset),
    isBuy: params.isBuy,
    limitPx: scalePerpDecimalTo1e8(params.limitPrice, "Limit price"),
    sz: scalePerpDecimalTo1e8(params.size, "Size"),
    reduceOnly: params.reduceOnly ?? false,
    orderType: {
      trigger: {
        triggerPx: scalePerpDecimalTo1e8(params.triggerPrice, "Trigger price"),
        isMarket: params.isMarket,
        tpsl: params.tpsl,
      },
    },
    cloid: normalizeCloid(params.cloid),
  };
}

/** A take-profit or stop-loss exit with its signed execution bound. */
export type PerpBracketExit = { triggerPrice: string; limitPrice: string };

/**
 * An entry order with attached TP/SL exits, grouped `normalTpsl` so the exits
 * only activate once the entry fills. Exits are reduce-only market triggers on
 * the opposite side for the full entry size, cloids derived from the nonce.
 */
export function buildTeePerpBracketBatchAction(params: {
  entry: { asset: number; isBuy: boolean; price: string; size: string; tif: PerpTif; reduceOnly?: boolean };
  takeProfit: PerpBracketExit | null;
  stopLoss: PerpBracketExit | null;
  nonce: number | bigint;
}): TeePerpOrderBatchAction {
  if (!params.takeProfit && !params.stopLoss) {
    throw new TypeError("A TP/SL bracket needs a take-profit or stop-loss price");
  }
  const orders = [buildTeePerpLimitOrderWire({ ...params.entry, cloid: deriveTeePerpBatchCloid(params.nonce, 0) })];
  const exits: Array<[PerpTpsl, PerpBracketExit | null]> = [["tp", params.takeProfit], ["sl", params.stopLoss]];
  for (const [tpsl, exit] of exits) {
    if (!exit) continue;
    orders.push(buildTeePerpTriggerOrderWire({
      asset: params.entry.asset,
      isBuy: !params.entry.isBuy,
      triggerPrice: exit.triggerPrice,
      limitPrice: exit.limitPrice,
      size: params.entry.size,
      isMarket: true,
      tpsl,
      reduceOnly: true,
      cloid: deriveTeePerpBatchCloid(params.nonce, orders.length),
    }));
  }
  return { orders, grouping: "normalTpsl" };
}

/**
 * Reduce-only TP/SL exits on an existing position, grouped `positionTpsl`.
 * `isBuy` is the exit side (the opposite of the position).
 */
export function buildTeePerpPositionTpslBatchAction(params: {
  asset: number;
  isBuy: boolean;
  size: string;
  takeProfit: PerpBracketExit | null;
  stopLoss: PerpBracketExit | null;
  nonce: number | bigint;
}): TeePerpOrderBatchAction {
  if (!params.takeProfit && !params.stopLoss) {
    throw new TypeError("Position TP/SL needs a take-profit or stop-loss price");
  }
  const orders: TeePerpOrderWire[] = [];
  const exits: Array<[PerpTpsl, PerpBracketExit | null]> = [["tp", params.takeProfit], ["sl", params.stopLoss]];
  for (const [tpsl, exit] of exits) {
    if (!exit) continue;
    orders.push(buildTeePerpTriggerOrderWire({
      asset: params.asset,
      isBuy: params.isBuy,
      triggerPrice: exit.triggerPrice,
      limitPrice: exit.limitPrice,
      size: params.size,
      isMarket: true,
      tpsl,
      reduceOnly: true,
      cloid: deriveTeePerpBatchCloid(params.nonce, orders.length),
    }));
  }
  return { orders, grouping: "positionTpsl" };
}

/** Scale legs submitted together as one ungrouped (`na`) batch. */
export function buildTeePerpScaleBatchAction(params: {
  asset: number;
  isBuy: boolean;
  legs: readonly PerpScaleLeg[];
  tif: PerpTif;
  reduceOnly?: boolean;
  nonce: number | bigint;
}): TeePerpOrderBatchAction {
  if (params.legs.length === 0 || params.legs.length > MAX_TEE_PERP_ORDER_BATCH_CHILDREN) {
    throw new TypeError("An order batch needs 1 to 100 orders");
  }
  return {
    orders: params.legs.map((leg, index) =>
      buildTeePerpLimitOrderWire({
        asset: params.asset,
        isBuy: params.isBuy,
        price: leg.price,
        size: leg.size,
        tif: params.tif,
        reduceOnly: params.reduceOnly,
        cloid: deriveTeePerpBatchCloid(params.nonce, index),
      })
    ),
    grouping: "na",
  };
}

// -------------------- Market and tick pricing --------------------

/**
 * The IOC limit price of a market order: `referencePrice` moved by
 * `slippageBps` against the trader, rounded to a valid Hyperliquid tick inside
 * that bound (at most five significant figures, integers always valid, at most
 * `6 - szDecimals` decimals; buys round down, sells round up). Returns `""`
 * when no tick inside the band still crosses the reference price.
 */
export function formatPerpMarketLimitPrice(params: {
  referencePrice: string;
  side: "Buy" | "Sell";
  sizeDecimals: number | null | undefined;
  slippageBps?: number;
}): string {
  const sizeDecimals = normalizeSizeDecimals(params.sizeDecimals);
  const slippageBps = params.slippageBps ?? PERP_MARKET_SLIPPAGE_BPS;
  if (sizeDecimals === null || !Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps >= BPS_DENOMINATOR) {
    return "";
  }
  try {
    const price = parseUnsignedDecimal(params.referencePrice, "Reference price");
    if (price.units <= 0n) return "";
    const factor = params.side === "Buy" ? BPS_DENOMINATOR + slippageBps : BPS_DENOMINATOR - slippageBps;
    const numerator = price.units * BigInt(factor);
    const denominator = 10n ** BigInt(price.scale) * BigInt(BPS_DENOMINATOR);
    let exponent: number;
    if (numerator >= denominator) {
      exponent = (numerator / denominator).toString().length - 1;
    } else {
      let scaled = numerator;
      let places = 0;
      while (scaled < denominator) {
        scaled *= 10n;
        places += 1;
      }
      exponent = -places;
    }
    const maxDecimals = Math.max(0, HYPERLIQUID_PERP_MAX_PRICE_DECIMALS - sizeDecimals);
    const sigFigExponent = exponent - HYPERLIQUID_PERP_MAX_PRICE_SIGNIFICANT_FIGURES + 1;
    const tickExponent = Math.max(Math.min(0, sigFigExponent), -maxDecimals);
    const tickScale = -tickExponent;
    const scaledNumerator = numerator * 10n ** BigInt(tickScale);
    const quotient = scaledNumerator / denominator;
    const ticks = params.side === "Buy" || scaledNumerator % denominator === 0n ? quotient : quotient + 1n;
    const marketPrice = formatUnsignedUnits(ticks, tickScale);
    if (!marketPrice) return "";
    const crosses = params.side === "Buy"
      ? compareDecimals(marketPrice, params.referencePrice) >= 0
      : compareDecimals(marketPrice, params.referencePrice) <= 0;
    return crosses ? marketPrice : "";
  } catch {
    return "";
  }
}

/** Trigger order kinds. */
export type PerpTriggerOrderKind = "stopMarket" | "stopLimit" | "takeProfitMarket" | "takeProfitLimit";

/** Whether a trigger kind executes as a market order once triggered. */
export const isPerpMarketTriggerKind = (kind: PerpTriggerOrderKind): boolean =>
  kind === "stopMarket" || kind === "takeProfitMarket";

/** The trigger direction of a trigger kind. */
export const perpTriggerKindTpsl = (kind: PerpTriggerOrderKind): PerpTpsl =>
  kind === "takeProfitMarket" || kind === "takeProfitLimit" ? "tp" : "sl";

/**
 * The limit price a trigger order signs. Market triggers execute as IOC at up
 * to the slippage band beyond the trigger price (same rule as market orders).
 */
export function resolvePerpTriggerLimitPrice(params: {
  kind: PerpTriggerOrderKind;
  side: "Buy" | "Sell";
  triggerPrice: string;
  limitPrice?: string;
  sizeDecimals: number | null | undefined;
  slippageBps?: number;
}): string {
  return isPerpMarketTriggerKind(params.kind)
    ? formatPerpMarketLimitPrice({
      referencePrice: params.triggerPrice,
      side: params.side,
      sizeDecimals: params.sizeDecimals,
      slippageBps: params.slippageBps,
    })
    : (params.limitPrice ?? "");
}

// -------------------- Scale orders --------------------

export const PERP_SCALE_MIN_ORDERS = 2;
export const PERP_SCALE_MAX_ORDERS = 100;
export const PERP_SCALE_MAX_SKEW = "100";

/** One resting leg of a scale order. */
export type PerpScaleLeg = { price: string; size: string };

/** Why a scale order could not be split. */
export type PerpScaleIssue =
  | "scaleOrderCount"
  | "scaleSkew"
  | "scalePriceRange"
  | "scaleSizeTooSmall"
  | "scalePrecision";

const SCALE_WORKING_SCALE = 12;

function roundScalePriceToTick(units: bigint, side: "Buy" | "Sell", sizeDecimals: number): string {
  const magnitude = units.toString().length - 1 - SCALE_WORKING_SCALE;
  const sigFigDecimals = Math.max(0, HYPERLIQUID_PERP_MAX_PRICE_SIGNIFICANT_FIGURES - 1 - magnitude);
  const decimals = Math.min(sigFigDecimals, Math.max(0, HYPERLIQUID_PERP_MAX_PRICE_DECIMALS - sizeDecimals));
  const divisor = 10n ** BigInt(SCALE_WORKING_SCALE - decimals);
  const quotient = units / divisor;
  const ticks = side === "Sell" && units % divisor !== 0n ? quotient + 1n : quotient;
  return formatUnsignedUnits(ticks, decimals);
}

/**
 * Round a price to Hyperliquid's tick for one side: buys round down and sells
 * round up. Returns `""` for an invalid price or size precision.
 */
export function roundPerpPriceToTick(
  price: string,
  side: "Buy" | "Sell",
  sizeDecimals: number | null | undefined,
): string {
  const lotDecimals = normalizeSizeDecimals(sizeDecimals);
  if (lotDecimals === null) return "";
  try {
    const units = toUnitsAtScale(price, SCALE_WORKING_SCALE);
    return units > 0n ? roundScalePriceToTick(units, side, lotDecimals) : "";
  } catch {
    return "";
  }
}

/**
 * Split `totalSize` into `orderCount` limit legs evenly spaced from
 * `startPrice` to `endPrice`. `sizeSkew` is the last leg's size divided by the
 * first leg's (1 = equal sizes). Leg sizes are floored to the lot size and the
 * remaining lots go to the last legs, so the legs sum to exactly `totalSize`.
 */
export function buildPerpScaleOrderLegs(params: {
  startPrice: string;
  endPrice: string;
  totalSize: string;
  orderCount: number;
  sizeSkew: string;
  side: "Buy" | "Sell";
  sizeDecimals: number | null | undefined;
}): { legs: PerpScaleLeg[] } | { issue: PerpScaleIssue } {
  const lotDecimals = normalizeSizeDecimals(params.sizeDecimals);
  if (lotDecimals === null) return { issue: "scalePrecision" };
  const { orderCount } = params;
  if (!Number.isInteger(orderCount) || orderCount < PERP_SCALE_MIN_ORDERS || orderCount > PERP_SCALE_MAX_ORDERS) {
    return { issue: "scaleOrderCount" };
  }
  let startUnits: bigint;
  let endUnits: bigint;
  let skewUnits: bigint;
  let sizeLots: bigint;
  try {
    startUnits = toUnitsAtScale(params.startPrice, SCALE_WORKING_SCALE);
    endUnits = toUnitsAtScale(params.endPrice, SCALE_WORKING_SCALE);
    skewUnits = toUnitsAtScale(params.sizeSkew, SCALE_WORKING_SCALE);
    const parsedSize = parseUnsignedDecimal(params.totalSize, "Size");
    if (parsedSize.scale > lotDecimals) return { issue: "scalePrecision" };
    sizeLots = parsedSize.units * 10n ** BigInt(lotDecimals - parsedSize.scale);
  } catch {
    return { issue: "scalePriceRange" };
  }
  const one = 10n ** BigInt(SCALE_WORKING_SCALE);
  if (skewUnits <= 0n || skewUnits > toUnitsAtScale(PERP_SCALE_MAX_SKEW, SCALE_WORKING_SCALE)) {
    return { issue: "scaleSkew" };
  }
  if (startUnits <= 0n || endUnits <= 0n || startUnits === endUnits) return { issue: "scalePriceRange" };
  if (sizeLots < BigInt(orderCount)) return { issue: "scaleSizeTooSmall" };

  const steps = BigInt(orderCount - 1);
  const weights = Array.from({ length: orderCount }, (_, index) => steps * one + (skewUnits - one) * BigInt(index));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0n);
  const sizes = weights.map((weight) => (sizeLots * weight) / totalWeight);
  let remainder = sizeLots - sizes.reduce((sum, size) => sum + size, 0n);
  for (let index = orderCount - 1; remainder > 0n; index = (index - 1 + orderCount) % orderCount) {
    sizes[index] += 1n;
    remainder -= 1n;
  }
  if (sizes.some((size) => size <= 0n)) return { issue: "scaleSizeTooSmall" };

  const legs = sizes.map((lots, index) => {
    const priceUnits = startUnits + ((endUnits - startUnits) * BigInt(index)) / steps;
    return {
      price: roundScalePriceToTick(priceUnits, params.side, lotDecimals),
      size: formatUnsignedUnits(lots, lotDecimals),
    };
  });
  if (legs.some((leg) => !leg.price)) return { issue: "scalePriceRange" };
  return { legs };
}

// -------------------- Typed data --------------------

/** The exact integers the app key signs for one batch or trigger child. */
export type PerpOrderTermsValue = {
  asset: number;
  isBuy: boolean;
  limitPx: bigint;
  sz: bigint;
  reduceOnly: boolean;
  encodedTif: number;
  triggerPx: bigint;
  isMarket: boolean;
  tpsl: number;
  cloid: bigint;
};

/**
 * A limit child signs its TIF byte with no trigger (`triggerPx = 0`,
 * `isMarket = false`, `tpsl = 0`); a trigger child signs `encodedTif = 0`,
 * its trigger price, and `tpsl` 1 (take profit) or 2 (stop loss).
 */
export function toPerpOrderTerms(order: TeePerpOrderWire): PerpOrderTermsValue {
  const base = {
    asset: order.asset,
    isBuy: order.isBuy,
    limitPx: BigInt(order.limitPx),
    sz: BigInt(order.sz),
    reduceOnly: order.reduceOnly,
    cloid: BigInt(order.cloid),
  };
  if ("limit" in order.orderType) {
    return { ...base, encodedTif: order.orderType.limit.encodedTif, triggerPx: 0n, isMarket: false, tpsl: 0 };
  }
  const { triggerPx, isMarket, tpsl } = order.orderType.trigger;
  return { ...base, encodedTif: 0, triggerPx: BigInt(triggerPx), isMarket, tpsl: tpsl === "tp" ? 1 : 2 };
}

const SIGNED_GROUPING: Record<TeePerpOrderGrouping, number> = { na: 0, normalTpsl: 1, positionTpsl: 2 };

function typedData<const TTypes, const TPrimary extends string, TMessage, TDomainName extends string>(
  domain: DirectiveDomain<TDomainName>,
  types: TTypes,
  primaryType: TPrimary,
  message: TMessage,
) {
  return {
    domain,
    types: { EIP712Domain: DIRECTIVE_DOMAIN_FIELDS, ...types },
    primaryType,
    message,
  } as const;
}

/** Typed data for `/v1/tee-perp/orders/submit`. */
export function buildTeePerpLimitOrderTypedData(params: {
  account: string;
  nonce: number | bigint;
  action: HlLimitOrderAction;
  chainId: number;
}) {
  const { action } = params;
  return typedData(createHypercallApiSignDomain(params.chainId), HL_ORDER_TYPES, "HLOrder", {
    account: params.account,
    nonce: checkNonce(params.nonce),
    action: {
      asset: action.asset,
      isBuy: action.isBuy,
      limitPx: BigInt(action.limitPx),
      sz: BigInt(action.sz),
      reduceOnly: action.reduceOnly,
      encodedTif: action.encodedTif,
      cloid: BigInt(action.cloid),
    },
  });
}

/** Typed data for `/v1/tee-perp/cancels/submit` (cancel by cloid). */
export function buildTeePerpCancelByCloidTypedData(params: {
  account: string;
  nonce: number | bigint;
  action: HlCancelByCloidAction;
  chainId: number;
}) {
  return typedData(createHypercallApiSignDomain(params.chainId), HL_CANCEL_BY_CLOID_TYPES, "HLCancelByCloid", {
    account: params.account,
    nonce: checkNonce(params.nonce),
    action: { asset: params.action.asset, cloid: BigInt(params.action.cloid) },
  });
}

/** Typed data for `/v1/tee-perp/cancels/submit-by-oid`. */
export function buildTeePerpCancelByOidTypedData(params: {
  account: string;
  nonce: number | bigint;
  action: HlCancelByOidAction;
  chainId: number;
}) {
  return typedData(createHypercallApiSignDomain(params.chainId), HL_CANCEL_BY_OID_TYPES, "HLCancel", {
    account: params.account,
    nonce: checkNonce(params.nonce),
    action: { asset: params.action.asset, oid: BigInt(params.action.oid) },
  });
}

/** Typed data for `/v1/tee-perp/orders/submit-trigger`. */
export function buildTeePerpTriggerOrderTypedData(params: {
  account: string;
  nonce: number | bigint;
  order: TeePerpOrderWire;
  chainId: number;
}) {
  if (!("trigger" in params.order.orderType)) {
    throw new TypeError("A trigger submission needs a trigger order");
  }
  return typedData(createHypercallApiSignDomain(params.chainId), HC_PERP_TRIGGER_ORDER_TYPES, "HCPerpTriggerOrder", {
    account: params.account,
    nonce: checkNonce(params.nonce),
    order: toPerpOrderTerms(params.order),
  });
}

/** Typed data for `/v1/tee-perp/orders/submit-batch`. */
export function buildTeePerpOrderBatchTypedData(params: {
  account: string;
  nonce: number | bigint;
  batch: TeePerpOrderBatchAction;
  chainId: number;
}) {
  const { orders } = params.batch;
  if (orders.length === 0 || orders.length > MAX_TEE_PERP_ORDER_BATCH_CHILDREN) {
    throw new TypeError("An order batch needs 1 to 100 orders");
  }
  if (new Set(orders.map((order) => order.cloid)).size !== orders.length) {
    throw new TypeError("Every order in a batch must use a distinct cloid");
  }
  return typedData(createHypercallApiSignDomain(params.chainId), HC_PERP_ORDER_BATCH_TYPES, "HCPerpOrderBatch", {
    account: params.account,
    nonce: checkNonce(params.nonce),
    grouping: SIGNED_GROUPING[params.batch.grouping],
    orders: orders.map(toPerpOrderTerms),
  });
}

/** Typed data for `/v1/tee-perp/leverage/submit`. */
export function buildTeePerpLeverageTypedData(params: {
  account: string;
  nonce: number | bigint;
  action: TeePerpLeverageAction;
  chainId: number;
}) {
  return typedData(
    createHypercallApiSignDomain(params.chainId),
    HC_PERP_LEVERAGE_CHANGE_TYPES,
    "HCPerpLeverageChange",
    {
      account: params.account,
      nonce: checkNonce(params.nonce),
      action: { asset: params.action.asset, isCross: params.action.isCross, leverage: params.action.leverage },
    },
  );
}

// -------------------- Enrollment and builder approval --------------------

/** EIP-191 message the account manager signs to authenticate enrollment calls (`timestamp` in seconds). */
export function buildHypercallAuthenticationMessage(timestamp: number): string {
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new TypeError("timestamp must be a positive integer number of seconds");
  }
  return `Sign this message to authenticate for Hypercall\nTimestamp: ${timestamp}`;
}

/** `Account.approveZeroFeeBuilder(address)` function selector. */
export const APPROVE_ZERO_FEE_BUILDER_SELECTOR = "0x19738466";

/** ABI fragment of the Account 0.2.4 builder approval. */
export const ACCOUNT_BUILDER_APPROVAL_ABI = [
  {
    type: "function",
    name: "approveZeroFeeBuilder",
    stateMutability: "nonpayable",
    inputs: [{ name: "builder", type: "address" }],
    outputs: [],
  },
] as const;

/**
 * Calldata for `Account.approveZeroFeeBuilder(builder)`. Send it from the
 * account manager wallet to the Account.sol address on HyperEVM. A 0% approval
 * is idempotent and cannot later authorize a nonzero fee.
 */
export function encodeApproveZeroFeeBuilderCalldata(builder: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(builder) || /^0x0{40}$/.test(builder)) {
    throw new TypeError("builder must be a non-zero EVM address");
  }
  return `${APPROVE_ZERO_FEE_BUILDER_SELECTOR}${builder.slice(2).toLowerCase().padStart(64, "0")}`;
}

/** Thrown when Hypercall's builder address is unavailable or when an order reports `builder_not_approved`. */
export class BuilderApprovalRequiredError extends Error {
  /** Account that must approve the builder. */
  readonly account: string | null;

  constructor(account: string | null, message = "Approve the Hypercall builder (zero fee) before placing perp orders") {
    super(message);
    this.name = "BuilderApprovalRequiredError";
    this.account = account;
  }
}

/**
 * The Hypercall builder from `/exchange-info` `hl_builder_address`. Never
 * guessed: a missing or zero address throws.
 */
export function resolveHypercallBuilderAddress(
  exchangeInfo: { hl_builder_address?: string | null } | null | undefined,
): `0x${string}` {
  const configured = exchangeInfo?.hl_builder_address;
  if (!configured || !/^0x[0-9a-fA-F]{40}$/.test(configured) || /^0x0{40}$/.test(configured)) {
    throw new BuilderApprovalRequiredError(null, "Hypercall builder address is not published by this API");
  }
  return configured as `0x${string}`;
}
