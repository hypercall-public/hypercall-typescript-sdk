import * as v from "@valibot/valibot";

import { NonEmptyString, NonNegativeInteger, parse, PositiveInteger, WalletAddress } from "../../_base.ts";
import { buildSignedBody, type ExchangeConfig, type ExchangeRequestOptions } from "./_base/mod.ts";
import { OrderSide, type OrderUpdateMessage, TimeInForce } from "./_base/order.ts";

// -------------------- Schemas --------------------

/** Pre-signed request to replace an order. */
export const ReplaceOrderRequest = v.pipe(
  v.object({
    /** Wallet performing the action. */
    wallet: v.pipe(WalletAddress, v.description("Wallet address.")),
    /** Order ID to cancel before placing the replacement. */
    order_id: v.pipe(PositiveInteger, v.description("Order ID.")),
    /** Replacement order symbol. */
    symbol: v.pipe(NonEmptyString, v.description("Order symbol.")),
    /** Replacement order side. */
    side: v.pipe(OrderSide, v.description("Order side.")),
    /** Replacement order size as a decimal string. */
    size: v.pipe(NonEmptyString, v.description("Order size.")),
    /** Replacement order price as a decimal string. */
    price: v.pipe(NonEmptyString, v.description("Order price.")),
    /** Replacement order time in force. */
    tif: v.pipe(TimeInForce, v.description("Time in force.")),
    /** Whether the replacement may only reduce an existing position. */
    reduce_only: v.pipe(v.optional(v.boolean()), v.description("Reduce-only flag.")),
    /** Optional client order ID for the replacement. Empty string is accepted for legacy signatures. */
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
  v.description("Pre-signed request to replace an order."),
);
export type ReplaceOrderRequest = v.InferOutput<typeof ReplaceOrderRequest>;

/** Parameters for the {@linkcode replaceOrder} function. */
export type ReplaceOrderParameters = v.InferInput<typeof ReplaceOrderRequest>;

/** Response for replacing an order. */
export type ReplaceOrderResponse = OrderUpdateMessage;

/** Request options for the {@linkcode replaceOrder} function. */
export type ReplaceOrderOptions = ExchangeRequestOptions;

/**
 * Replace an order using a pre-signed Hypercall EIP-712 payload.
 *
 * Signing: pre-signed EIP-712 `ReplaceOrder` payload. A request with
 * `reduce_only: true` must use the `ReplaceOrderReduceOnly` EIP-712 type.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Pre-signed parameters specific to the API request.
 * @param opts Request execution options.
 * @return Order update response for the replacement.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercall/sdk";
 * import { replaceOrder } from "@hypercall/sdk/api/exchange";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 *
 * const data = await replaceOrder({ transport }, {
 *   wallet: "0x0000000000000000000000000000000000000000",
 *   order_id: 123,
 *   symbol: "BTC-30JUN26-100000-C",
 *   side: "Buy",
 *   size: "0.1",
 *   price: "101",
 *   tif: "gtc",
 *   client_id: "client-124",
 *   nonce: 2,
 *   signature: "0x...",
 * });
 * ```
 *
 * @see https://docs.hypercall.xyz/docs/trading/over-api/
 */
export function replaceOrder(
  config: ExchangeConfig,
  params: ReplaceOrderParameters,
  opts?: ReplaceOrderOptions,
): Promise<ReplaceOrderResponse> {
  const request = parse(ReplaceOrderRequest, params);

  return config.transport.request<ReplaceOrderResponse>(
    "/order",
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(buildSignedBody(request)),
    },
    opts?.signal,
  );
}
