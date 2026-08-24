/**
 * Hypercall API TypeScript SDK.
 *
 * The main entrypoint exports:
 * - Transports: {@link HttpTransport}
 * - Clients: {@link InfoClient}, {@link ExchangeClient}
 *
 * For tree-shakeable, low-level access you can import request methods directly from:
 * - `@hypercallxyz/sdk/api/info`
 * - `@hypercallxyz/sdk/api/exchange`
 * - `@hypercallxyz/sdk/signing`
 *
 * @example Quick start
 * ```ts
 * import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";
 *
 * const transport = new HttpTransport();
 * const info = new InfoClient({ transport });
 *
 * const markets = await info.markets();
 * console.log(markets);
 * ```
 *
 * @module
 */

export { HypercallError, ValidationError } from "./_base.ts";
export * from "./transport/mod.ts";
export * from "./api/exchange/client.ts";
export * from "./api/info/client.ts";
