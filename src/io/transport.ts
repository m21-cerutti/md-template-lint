/**
 * HTTP transport of the URL probe. The default one sits on `node:http` and
 * `node:https` so that the address check runs at CONNECT time, on the address the
 * socket really uses (DNS rebinding: a name can resolve to a public address for
 * the pre-check and to a loopback one a moment later). It never follows a
 * redirect, never reads a body, uses no proxy and no agent pool.
 *
 * The shape of the call is the shape of `fetch` (`redirect: "manual"`, `signal`),
 * so tests inject a fake and a real `fetch` could be injected too.
 */
import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { isAddressAllowed } from "./address.js";

export interface ProbeInit {
  readonly method: "HEAD" | "GET";
  readonly headers: Readonly<Record<string, string>>;
  readonly redirect: "manual";
  readonly credentials: "omit";
  readonly signal: AbortSignal;
}

export interface ProbeResponse {
  readonly status: number;
  /** A fetch `Response` body: cancelled at once, never read. */
  readonly body: { cancel(): unknown } | null;
}

export type ProbeFetch = (url: URL, init: ProbeInit) => Promise<ProbeResponse>;

/** Resolve a host name to its addresses (injected in tests). */
export type ResolveFn = (hostname: string) => Promise<readonly string[]>;

export const defaultResolve: ResolveFn = async (hostname) => (await dnsLookup(hostname, { all: true, verbatim: true })).map((entry) => entry.address);

/** Raised by the connect-time guard when the resolved address is not allowed. */
export class BlockedAddressError extends Error {
  readonly code = "EBLOCKED";
  constructor() {
    super("blocked address");
    this.name = "BlockedAddressError";
  }
}

/**
 * A `lookup` for `http.request`: resolves with `resolve`, refuses the connection
 * when ANY resolved address is blocked, otherwise hands the addresses to the socket.
 */
export function createGuardedLookup(resolve: ResolveFn, allowPrivate: boolean): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname).then(
      (addresses) => {
        const first = addresses[0];
        if (first === undefined) {
          callback(Object.assign(new Error("no address"), { code: "ENOTFOUND" }), "", 4);
        } else if (addresses.some((address) => !isAddressAllowed(address, allowPrivate))) {
          callback(new BlockedAddressError(), "", 4);
        } else if (options.all === true) {
          callback(
            null,
            addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 })),
          );
        } else callback(null, first, first.includes(":") ? 6 : 4);
      },
      (error: unknown) => {
        const code = (error as { code?: unknown }).code;
        callback(
          Object.assign(new Error("lookup failed"), {
            code: typeof code === "string" ? code : "ENOTFOUND",
          }),
          "",
          4,
        );
      },
    );
  };
}

/** Default transport: one request, status only, connection destroyed at once. */
export function createNodeTransport(resolve: ResolveFn, allowPrivate: boolean): ProbeFetch {
  const lookup = createGuardedLookup(resolve, allowPrivate);
  return (url, init) =>
    new Promise((resolvePromise, reject) => {
      const send = url.protocol === "https:" ? httpsRequest : httpRequest;
      const request = send(
        url,
        {
          method: init.method,
          headers: { ...init.headers },
          lookup,
          agent: false,
          signal: init.signal,
        },
        (response) => {
          response.destroy();
          resolvePromise({ status: response.statusCode ?? 0, body: null });
        },
      );
      request.on("error", reject);
      request.end();
    });
}
