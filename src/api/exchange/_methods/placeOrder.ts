import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";
import { OrderRoute, OrderSide, type OrderUpdateMessage, TimeInForce } from "./_base/order.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to place an order. */
export const PlaceOrderRequest = v.pipe(
  v.object({
    /** Wallet performing the action. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Order symbol. */
    symbol: v.pipe(NonEmptyString, v.description("Order symbol.")),
    /** Order side. */
    side: v.pipe(OrderSide, v.description("Order side.")),
    /** Order size as a decimal string. */
    size: v.pipe(NonEmptyString, v.description("Order size.")),
    /** Order price as a decimal string. */
    price: v.pipe(NonEmptyString, v.description("Order price.")),
    /** Time in force. */
    tif: v.pipe(TimeInForce, v.description("Time in force.")),
    /** Order route preference included in the signed payload. */
    route: v.pipe(OrderRoute, v.description("Route preference.")),
    /** Whether the order may only reduce an existing position. */
    reduce_only: v.pipe(v.optional(v.boolean()), v.description("Reduce-only flag.")),
    /** Optional client order ID. */
    client_id: v.pipe(v.optional(v.string()), v.description("Client order ID.")),
    /** Nonce used in the EIP-712 signature. */
    nonce: v.pipe(NonNegativeInteger, v.description("Signature nonce.")),
    /** EIP-712 signature. */
    signature: v.pipe(NonEmptyString, v.description("EIP-712 signature.")),
    /** Optional market-maker protection flag. */
    mmp_enabled: v.pipe(v.optional(v.boolean()), v.description("Market-maker protection flag.")),
    /** Optional builder code address. */
    builder_code_address: v.pipe(
      v.optional(v.nullable(WalletAddress)),
      v.description("Builder code address."),
    ),
  }),
  v.description("Pre-signed request to place an order."),
);
export type PlaceOrderRequest = v.InferOutput<typeof PlaceOrderRequest>;

/** Parameters for the {@linkcode placeOrder} function. */
export type PlaceOrderParameters = v.InferInput<typeof PlaceOrderRequest>;

/** Response for placing an order. */
export type PlaceOrderResponse = OrderUpdateMessage;

/** Request options for the {@linkcode placeOrder} function. */
export type PlaceOrderOptions = ExchangeRequestOptions;

/**
 * Place an order using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `PlaceOrder` payload.
 * The request body `route` must match the route included in the signed payload.
 * A request with `reduce_only: true` must use the `PlaceOrderReduceOnly` EIP-712 type.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Order update response.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercall/sdk";
 * import { placeOrder } from "@hypercall/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await placeOrder({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   symbol: "BTC-30JUN26-100000-C",
 *   side: "Buy",
 *   size: "0.1",
 *   price: "100",
 *   tif: "gtc",
 *   route: "best_execution",
 *   client_id: "client-123",
 *   nonce: 1,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function placeOrder(
  config: ExchangeConfig,
  params: PlaceOrderParameters,
  opts?: PlaceOrderOptions,
): Promise<PlaceOrderResponse> {
  const request = parse(PlaceOrderRequest, params);

  return config.transport.request<PlaceOrderResponse>(
    "/order",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
