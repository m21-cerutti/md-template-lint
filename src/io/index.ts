/**
 * Production `RuleIo` (docs/spec.md 2.8; A12.11 security requirements, OWASP A10).
 *
 * `exists`: a file system probe that never throws. Every OS error, a NUL byte
 * (`ERR_INVALID_ARG_VALUE`) included, is "does not exist". The caller passes the
 * same folded path the containment check judged (`src/rules/io.ts`).
 *
 * `probeUrl`: an SSRF-hardened HEAD, then GET once if HEAD fails.
 * - Order: parse, scheme allow-list (http and https only), numeric IP encodings,
 *   userinfo stripped, host verdict (IP literal, or every resolved address), request.
 *   Nothing touches the network before the scheme and the address are checked.
 * - The address is checked again at CONNECT time by the default transport
 *   (`src/io/transport.ts`), against DNS rebinding.
 * - `redirect: "manual"`: a 3xx is reachable and is never followed. The body is
 *   cancelled at once and never read. No cookies, no credentials, no auth header,
 *   fixed User-Agent, no proxy.
 * - Each request has `AbortSignal.timeout` (at most 5 s) and the whole URL a hard cap
 *   of 10 s.
 * - Run budget: a URL is probed once (the answer is cached) and at most `maxUrls`
 *   different URLs are probed per run.
 * - Never throws. The reason comes from a fixed vocabulary, never from a remote
 *   status text or a raw error message: `HTTP <status>`, `timeout`, `DNS failure`,
 *   `connection refused`, `blocked address`, `unsupported scheme`, `invalid URL`,
 *   `url budget exceeded`, `request failed`.
 */
import { stat } from "node:fs/promises";
import type { RuleIo, UrlProbe } from "../engine/rule.js";
import { isAddressAllowed, isIpLiteral, parseIPv4 } from "./address.js";
import { BlockedAddressError, createNodeTransport, defaultResolve, type ProbeFetch, type ResolveFn } from "./transport.js";

export { classifyAddress, isAddressAllowed } from "./address.js";
export type { AddressClass } from "./address.js";
export { BlockedAddressError, createGuardedLookup } from "./transport.js";
export type { ProbeFetch, ProbeInit, ProbeResponse, ResolveFn } from "./transport.js";

export const USER_AGENT = "md-template-lint link-check";
const PER_REQUEST_CAP_MS = 5000;
const DEFAULT_HARD_CAP_MS = 10_000;
const DEFAULT_MAX_URLS = 100;

export interface RealIoOptions {
  /** Config `allowPrivateNetworks`: also probe RFC 1918, 100.64.0.0/10 and fc00::/7. */
  readonly allowPrivateNetworks?: boolean;
  /** Transport (tests inject a fake; default: node http/https with a connect-time guard). */
  readonly fetch?: ProbeFetch;
  /** Name resolution (tests inject a fake; default: the OS resolver). */
  readonly resolve?: ResolveFn;
  /** Most distinct URLs probed per run (default 100). */
  readonly maxUrls?: number;
  /** Hard cap per URL over both requests, ms (default 10000). */
  readonly hardCapMs?: number;
}

const fail = (reason: string): UrlProbe => ({ reachable: false, reason });

/** Printable text only (reasons are built from constants; this is a last guard). */
function printable(text: string): string {
  return [...text]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f && !(code >= 0x80 && code <= 0x9f);
    })
    .join("");
}

/**
 * Scheme, then any number of slashes (the URL parser accepts `http:/host`,
 * `http:host` and `http:///host` for http and https), then the authority.
 */
const AUTHORITY = /^[A-Za-z][A-Za-z0-9+.-]*:[/\\]*([^/\\?#]*)/;

/** The URL parser drops tab, LF and CR anywhere in the input. */
const withoutLineBreaks = (text: string): string => [...text].filter((char) => char !== "\t" && char !== "\n" && char !== "\r").join("");

/** Host as written in the URL text (userinfo and port removed), or null. */
function writtenHost(text: string): string | null {
  const authority = AUTHORITY.exec(withoutLineBreaks(text).trim())?.[1];
  if (authority === undefined) return null;
  const hostPort = authority.slice(authority.lastIndexOf("@") + 1);
  if (hostPort.startsWith("[")) return hostPort.slice(0, hostPort.indexOf("]") + 1);
  return hostPort.split(":")[0] ?? null;
}

/** Error code of an error, its cause or its first aggregated error. */
function errorCode(error: unknown): string {
  const seen = [error, (error as { cause?: unknown })?.cause, (error as { errors?: unknown[] })?.errors?.[0]];
  for (const item of seen) {
    const code = (item as { code?: unknown } | null | undefined)?.code;
    if (typeof code === "string") return code;
  }
  return "";
}

function reasonOf(error: unknown, signal: AbortSignal): string {
  const code = errorCode(error);
  if (error instanceof BlockedAddressError || code === "EBLOCKED") return "blocked address";
  const name = (error as { name?: unknown } | null)?.name;
  if (signal.aborted || name === "TimeoutError" || name === "AbortError") return "timeout";
  if (code === "ECONNREFUSED") return "connection refused";
  if (["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "EAI_NODATA"].includes(code)) return "DNS failure";
  return "request failed";
}

/** `promise`, but rejected as soon as `signal` aborts. */
function until<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => reject(signal.reason);
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/** Production io: file system `exists` and the hardened `probeUrl`. */
export function createRealIo(options: RealIoOptions = {}): RuleIo {
  const allowPrivate = options.allowPrivateNetworks === true;
  const resolve = options.resolve ?? defaultResolve;
  const transport = options.fetch ?? createNodeTransport(resolve, allowPrivate);
  const maxUrls = options.maxUrls ?? DEFAULT_MAX_URLS;
  const hardCap = options.hardCapMs ?? DEFAULT_HARD_CAP_MS;
  const seen = new Map<string, Promise<UrlProbe>>();

  /** Reason to refuse the host, or null when it may be probed. */
  async function hostProblem(url: URL, written: string | null, overall: AbortSignal) {
    const host = url.hostname;
    const bare = host.endsWith(".") ? host.slice(0, -1) : host;
    if (bare === "localhost" || bare.endsWith(".localhost")) return "blocked address";
    if (isIpLiteral(host)) {
      // The URL parser already folded `2130706433`, `0x7f.1` or `127.1` to dotted quads.
      // Such a spelling is refused whatever the address. When the written host cannot be
      // read back from the text, the spelling is unknown and the URL is refused too.
      const numericSpelling = parseIPv4(host) !== null && (written === null || written.toLowerCase() !== host);
      return numericSpelling || !isAddressAllowed(host, allowPrivate) ? "blocked address" : null;
    }
    let addresses: readonly string[];
    try {
      addresses = await until(resolve(host), overall);
    } catch (error) {
      return reasonOf(error, overall) === "timeout" ? "timeout" : "DNS failure";
    }
    if (addresses.length === 0) return "DNS failure";
    return addresses.every((address) => isAddressAllowed(address, allowPrivate)) ? null : "blocked address";
  }

  async function probe(text: string, timeoutMs: number): Promise<UrlProbe> {
    let url: URL;
    try {
      url = new URL(text);
    } catch {
      return fail("invalid URL");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return fail("unsupported scheme");
    url.username = "";
    url.password = "";
    url.hash = "";
    const overall = AbortSignal.timeout(hardCap);
    const problem = await hostProblem(url, writtenHost(text), overall);
    if (problem !== null) return fail(problem);

    const perRequest = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs, PER_REQUEST_CAP_MS) : PER_REQUEST_CAP_MS;
    let reason = "request failed";
    for (const method of ["HEAD", "GET"] as const) {
      const signal = AbortSignal.any([AbortSignal.timeout(perRequest), overall]);
      try {
        const response = await transport(url, {
          method,
          headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
          redirect: "manual",
          credentials: "omit",
          signal,
        });
        try {
          Promise.resolve(response.body?.cancel()).catch(() => undefined);
        } catch {
          // A body that cannot be cancelled is dropped.
        }
        const status = response.status;
        if (status >= 200 && status < 400) return { reachable: true };
        reason = Number.isInteger(status) && status >= 100 && status <= 599 ? `HTTP ${status}` : "request failed";
      } catch (error) {
        reason = reasonOf(error, signal);
        if (reason === "blocked address") break;
      }
      if (overall.aborted) {
        reason = "timeout";
        break;
      }
    }
    return fail(reason);
  }

  return {
    async exists(path: string): Promise<boolean> {
      if (path.includes("\u0000")) return false;
      try {
        await stat(path);
        return true;
      } catch {
        return false;
      }
    },
    probeUrl(url: string, timeoutMs: number): Promise<UrlProbe> {
      const key = String(url).trim();
      const known = seen.get(key);
      if (known !== undefined) return known;
      if (seen.size >= maxUrls) return Promise.resolve(fail("url budget exceeded"));
      const answer = probe(key, timeoutMs).then(
        (result) => (result.reachable ? result : fail(printable(result.reason))),
        () => fail("request failed"),
      );
      seen.set(key, answer);
      return answer;
    },
  };
}
