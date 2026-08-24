/** Ethereum-style wallet or contract address. */
export type Address = `0x${string}`;

/** Decimal serialized by the API as a string. */
export type Decimal = string;

/** Trade or order side returned by REST endpoints. */
export type Side = "Buy" | "Sell";

/** Instrument family returned by fills and orders. */
export type InstrumentType = "option" | "perp";

/** Common paginated response metadata. */
export type Pagination = {
  /** Page size used by the request. */
  limit: number;
  /** Number of rows skipped before this page. */
  offset: number;
  /** Number of rows returned in this page. */
  count: number;
};

/** Common list response envelope. */
export type ListResponse<TItem> = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Returned records. */
  data: TItem[];
};

/** Common paginated list response envelope. */
export type PaginatedResponse<TItem> = ListResponse<TItem> & {
  /** Pagination metadata. */
  pagination: Pagination;
};

/** Common success/error response envelope. */
export type ApiResponse<TData> = {
  /** Whether the request succeeded. */
  success: boolean;
  /** Response payload, present on success. */
  data?: TData | null;
  /** Human-readable error message, present on failure. */
  error?: string | null;
};

/** JSON-RPC error object returned by Deribit-compatible info endpoints. */
export type JsonRpcError = {
  /** Error code. */
  code: number;
  /** Error message. */
  message: string;
  /** Additional error data. */
  data?: unknown;
};

/** JSON-RPC style response returned by Deribit-compatible info endpoints. */
export type JsonRpcResponse<TResult> = {
  /** JSON-RPC version. */
  jsonrpc: string;
  /** Result data, present on success. */
  result?: TResult;
  /** Error information, present on failure. */
  error?: JsonRpcError;
  /** Whether the response came from a testnet API. */
  testnet: boolean;
  /** Processing time in microseconds. */
  usDiff: number;
  /** Request received timestamp in microseconds. */
  usIn: number;
  /** Response sent timestamp in microseconds. */
  usOut: number;
};

/** Tick-size rule used by instruments. */
export type TickSizeStep = {
  /** Tick size at this level. */
  tick_size: number;
  /** Price above which this tick size applies. */
  above_price: number;
};

/** Option Greeks. */
export type Greeks = {
  /** Delta. */
  delta: number;
  /** Gamma. */
  gamma: number;
  /** Theta. */
  theta: number;
  /** Vega. */
  vega: number;
  /** Rho. */
  rho: number;
};
