import { type IRequestTransport, TransportError } from "../_base.ts";
import * as abort from "../_abort.ts";

/** Mainnet API URL. */
export const MAINNET_API_URL = "https://api.hypercall.xyz";

/** Options for {@linkcode HttpTransport}. */
export interface HttpTransportOptions {
  /** Request timeout in milliseconds. Set to `null` to disable the timeout. */
  timeout?: number | null;
  /** API base URL. Defaults to {@link MAINNET_API_URL}. */
  apiUrl?: string | URL;
  /** Default fetch options applied to every request. `method` and `body` are controlled by the SDK. */
  fetchOptions?: Omit<RequestInit, "body" | "method">;
}

/** Error thrown when an HTTP request fails. */
export class HttpRequestError extends TransportError {
  /** Cloned HTTP response, when one was received. */
  response?: Response;
  /** SDK request context that produced the error. */
  request?: unknown;

  constructor(options?: ErrorOptions & { detail?: string; response?: Response; request?: unknown }) {
    const { detail, response, request, ...errorOptions } = options ?? {};
    let message: string;

    if (response) {
      message = `${response.status} ${response.statusText}`.trim();
      if (detail) {
        message += ` - ${detail}`;
      }
    } else if (detail) {
      message = detail;
    } else {
      const cause = errorOptions.cause;
      message = cause === undefined
        ? "Unknown HTTP request error"
        : `Unknown HTTP request error: ${cause instanceof Error ? cause.message : String(cause)}`;
    }

    super(message, errorOptions);
    this.name = "HttpRequestError";
    this.response = response;
    this.request = request;
  }
}

/**
 * HTTP implementation of the REST transport interface.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@hypercallxyz/sdk";
 *
 * const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
 * ```
 */
export class HttpTransport implements IRequestTransport {
  /** Request timeout in milliseconds. `null` disables the timeout. */
  timeout: number | null;
  /** API base URL used to resolve request paths. */
  apiUrl: string | URL;
  /** Default fetch options applied to every request. */
  fetchOptions: Omit<RequestInit, "body" | "method">;

  constructor(options: HttpTransportOptions = {}) {
    this.timeout = options.timeout === undefined ? 10_000 : options.timeout;
    this.apiUrl = options.apiUrl ?? MAINNET_API_URL;
    this.fetchOptions = options.fetchOptions ?? {};
  }

  /**
   * Execute a JSON REST request.
   *
   * @param path REST path, including any query string.
   * @param init Request options for this call.
   * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
   * @return Parsed JSON response body.
   *
   * @throws {HttpRequestError} When fetch fails, the request is aborted, the request times out, the response is not JSON, or the response is not successful.
   */
  async request<TResponse = unknown>(
    path: string,
    init: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeoutMs = this.timeout;
    const timeout = abort.scheduleTimeout(controller, timeoutMs);
    const detachRelay = abort.relay([signal, this.fetchOptions.signal, init.signal], controller);
    const request = { path, init };

    try {
      const url = buildRequestUrl(this.apiUrl, path);
      const requestInit = mergeRequestInit(
        {
          headers: {
            accept: "application/json",
          },
        },
        this.fetchOptions,
        init,
        { signal: controller.signal },
      );

      const response = await fetch(url, requestInit);

      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        const clone = response.clone();
        const body = await response.text().catch(() => undefined);
        throw new HttpRequestError({
          response: clone,
          detail: body ? truncate(body) : undefined,
          request,
        });
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as TResponse;
      } catch (error) {
        throw new HttpRequestError({
          response: recreateResponse(response, text),
          detail: "Invalid JSON response body",
          cause: error,
          request,
        });
      }
    } catch (error) {
      if (error instanceof TransportError) {
        throw error;
      }
      if (error === timeout.reason) {
        throw new HttpRequestError({
          detail: `Request timed out after ${timeoutMs} ms`,
          cause: error,
          request,
        });
      }
      if (controller.signal.aborted && error === controller.signal.reason) {
        throw new HttpRequestError({ detail: "Request aborted", cause: error, request });
      }
      throw new HttpRequestError({ cause: error, request });
    } finally {
      timeout.cancel();
      detachRelay();
    }
  }
}

function truncate(text: string, limit = 1024): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}... (${text.length} chars total)`;
}

function buildRequestUrl(base: string | URL, path: string): URL {
  const baseUrl = new URL(base);
  if (!baseUrl.pathname.endsWith("/")) {
    baseUrl.pathname += "/";
  }
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, baseUrl);
  url.search = url.search || baseUrl.search;
  return url;
}

function recreateResponse(original: Response, text: string): Response {
  return new Response(text || null, {
    status: original.status,
    statusText: original.statusText,
    headers: original.headers,
  });
}

function mergeHeadersInit(...inits: Array<HeadersInit | undefined>): Headers {
  const merged = new Headers();

  for (const headers of inits) {
    if (!headers) {
      continue;
    }

    new Headers(headers).forEach((value, key) => {
      merged.set(key, value);
    });
  }

  return merged;
}

function mergeRequestInit(...inits: RequestInit[]): RequestInit {
  const merged = inits.reduce<RequestInit>((acc, init) => {
    return { ...acc, ...init };
  }, {});

  merged.headers = mergeHeadersInit(...inits.map((init) => init.headers));

  return merged;
}
