import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import type { Address, Decimal, InstrumentType, PaginatedResponse, Side } from "./_base/_schemas.ts";
import { type InfoConfig, toQuery } from "./_base/mod.ts";

// -------------------- Schemas --------------------

/** Request orders for a wallet. */
export const OrdersRequest = v.pipe(
  v.object({
    /** Wallet address. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Maximum rows to return. */
    limit: v.pipe(v.optional(v.pipe(PositiveInteger, v.maxValue(50))), v.description("Limit.")),
    /** Rows to skip. */
    offset: v.pipe(v.optional(NonNegativeInteger), v.description("Offset.")),
    /** Optional order status filter. */
    status: v.pipe(v.optional(v.string()), v.description("Order status filter.")),
  }),
  v.description("Request orders for a wallet."),
);
export type OrdersRequest = v.InferOutput<typeof OrdersRequest>;

/** Request parameters for the {@linkcode orders} function. */
export type OrdersParameters = v.InferInput<typeof OrdersRequest>;

/** Order status values returned by the orders endpoint. */
export type OrderStatus =
  | "acked"
  | "open"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "canceled"
  | "rejected";

/** Time-in-force values returned by the orders endpoint. */
export type TimeInForce = "gtc" | "ioc" | "fok" | "GTC" | "IOC" | "FOK";

/** Resting or historical order. */
export type Order = {
  /** Unique order identifier assigned by the engine. */
  order_id: number;
  /** Owner wallet address. */
  wallet_address: Address;
  /** Instrument symbol. */
  symbol: string;
  /** Order side. */
  side: Side;
  /** Limit price in USD. */
  price: Decimal;
  /** Order size in contracts. */
  size: Decimal;
  /** Time-in-force policy, when the source exposes it. */
  tif?: TimeInForce;
  /** Current order status, if known. */
  status: OrderStatus | null;
  /** Order creation timestamp in milliseconds since epoch. */
  created_at: number;
  /** Timestamp of the last status change, if available. */
  updated_at: string | null;
  /** Cumulative filled size in contracts. */
  filled_size?: Decimal | null;
  /** Whether Market Maker Protection is enabled for this order. */
  mmp_enabled: boolean;
  /** Instrument family that produced this order. */
  instrument_type: InstrumentType;
};

/** Orders response. */
export type OrdersResponse = PaginatedResponse<Order>;

/** Request a HyperCore order status for a wallet. */
export const OrderStatusRequest = v.object({
  wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
  orderId: v.pipe(NonEmptyString, v.description("HyperCore order ID or client order ID.")),
});
export type OrderStatusRequest = v.InferOutput<typeof OrderStatusRequest>;
export type OrderStatusParameters = v.InferInput<typeof OrderStatusRequest>;

/** HyperCore order status response. */
export type OrderStatusResponse = {
  success: boolean;
  data: Order | null;
};

/**
 * Request orders for a wallet.
 *
 * @param config General configuration for Info API requests.
 * @param params Parameters specific to the API request.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Orders response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 * import { orders } from "@hypercallxyz/sdk/api/info";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await orders({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   limit: 50,
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function orders(
  config: InfoConfig,
  params: OrdersParameters,
  signal?: AbortSignal,
): Promise<OrdersResponse> {
  const request = parse(OrdersRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    limit: request.limit,
    offset: request.offset,
    status: request.status,
  });

  return config.transport.request<OrdersResponse>(`/orders?${query}`, {}, signal);
}

/** Request a HyperCore order status by numeric order ID or client order ID. */
export function orderStatus(
  config: InfoConfig,
  params: OrderStatusParameters,
  signal?: AbortSignal,
): Promise<OrderStatusResponse> {
  const request = parse(OrderStatusRequest, params);
  const query = toQuery({
    wallet: request.wallet.toLowerCase(),
    order_id: request.orderId,
  });
  return config.transport.request<OrderStatusResponse>(`/orders/status?${query}`, {}, signal);
}
