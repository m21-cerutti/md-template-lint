/** Fakes for the URL probe tests: an injected transport and resolver, no network. */
import type { ProbeFetch, ProbeInit, ProbeResponse, ResolveFn } from "../../src/io/index.js";

export interface Call {
  readonly url: URL;
  readonly init: ProbeInit;
}

export type Handler = (call: Call, index: number) => Promise<ProbeResponse> | ProbeResponse;

/** A transport that records every call and answers with `handler`. */
export function fakeFetch(handler: Handler): { fetch: ProbeFetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetch: ProbeFetch = (url, init) => {
    const call = { url, init };
    calls.push(call);
    return Promise.resolve(handler(call, calls.length - 1));
  };
  return { fetch, calls };
}

export const status = (code: number): ProbeResponse => ({ status: code, body: null });

/** A response that never arrives: it fails when the request is aborted, like fetch. */
export function hang(call: Call): Promise<ProbeResponse> {
  return new Promise((_resolve, reject) => {
    call.init.signal.addEventListener("abort", () => reject(call.init.signal.reason), {
      once: true,
    });
  });
}

/** A resolver answering from a map; an unknown name is ENOTFOUND. Records its calls. */
export function fakeResolve(map: Readonly<Record<string, readonly string[]>>): {
  resolve: ResolveFn;
  calls: string[];
} {
  const calls: string[] = [];
  const resolve: ResolveFn = (hostname) => {
    calls.push(hostname);
    const hit = map[hostname];
    if (hit === undefined) {
      return Promise.reject(Object.assign(new Error("not found"), { code: "ENOTFOUND" }));
    }
    return Promise.resolve(hit);
  };
  return { resolve, calls };
}

export const PUBLIC_HOST = "ok.example.com";
export const PUBLIC_ADDRESS = "93.184.216.34";
